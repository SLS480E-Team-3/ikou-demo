// DEV
'use client'

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import { OBJECTS } from "@/components/Game/Object/objects"
import { ENT_H } from "@/components/Game/Entity/entityRenderer"
import { fileFromCode, registerSprites, type FileSprite, type IslandFile } from "@/components/Game/islands/islandFile"
import { useHistory } from "./history"
import EditorCanvas, { type Selection, type Tool } from "./canvas"
import AssetBox from "./assetBox"
import { IslandPanel, SelectionPanel } from "./panels"
import PhoneView from "./phoneView"
import type { EditorQuest } from "./types"

type Island = { id: number, name: string }
const CODE = 'code'
// the version picker's entry for "the island as islands.ts has it"

const nextId = (base: string, taken: string[]) => {
    let i = 1
    while (taken.includes(`${base}-${i}`)) i++
    return `${base}-${i}`
}
// a fresh id for a new or duplicated item: <def or npc>-<first free number>

const json = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init)
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? res.statusText)
    return body as T
}

export default function IslandEditor() {
    const [islands, setIslands] = useState<Island[]>([])
    const [islandId, setIslandId] = useState(1)
    const [versions, setVersions] = useState<number[]>([])
    const [pick, setPick] = useState<string>(CODE)
    const [opened, setOpened] = useState<string>(CODE)
    const [quests, setQuests] = useState<EditorQuest[]>([])
    const [uploaded, setUploaded] = useState<FileSprite[]>([])
    const [selection, setSelection] = useState<Selection>(null)
    const [tool, setTool] = useState<Tool>(null)
    const [phone, setPhone] = useState(false)
    const [zoom, setZoom] = useState(0.45)
    const [status, setStatus] = useState('')
    const savedRef = useRef<IslandFile | null>(null)
    const h = useHistory<IslandFile>(fileFromCode(1))
    const file = h.state
    const dirty = savedRef.current !== null && savedRef.current !== file

    const loadIsland = useCallback(async (id: number, ver?: number) => {
        setStatus('loading…')
        try {
            const [{ versions: vers }, { quests: qs }] = await Promise.all([
                json<{ versions: number[] }>(`/api/IslandEditor?island=${id}`),
                json<{ quests: EditorQuest[] }>(`/api/IslandEditor/quests?island=${id}`).catch(() => ({ quests: [] })),
            ])
            setVersions(vers); setQuests(qs)
            const v = ver ?? vers[vers.length - 1]
            const f = v ? (await json<{ file: IslandFile }>(`/api/IslandEditor?island=${id}&ver=${v}`)).file : fileFromCode(id)
            registerSprites(f.sprites)
            savedRef.current = f
            h.reset(f)
            setPick(v ? String(v) : CODE); setOpened(v ? String(v) : CODE)
            setSelection(null)
            setStatus(v ? `opened ${id}_ver${v}.json` : vers.length ? 'opened the code version' : 'no saved versions yet: started from the code (islands.ts)')
        } catch (e) {
            setStatus(`load failed: ${(e as Error).message}`)
        }
    }, [h])
    // opens one version of an island (spec F-7): the given ver, else the
    // newest, else the code's island when nothing is saved. Quests load with
    // it; a failed quest load (columns missing) just leaves the list empty

    useEffect(() => {
        json<{ islands: Island[] }>('/api/IslandEditor').then(r => setIslands(r.islands)).catch(() => {})
        json<{ sprites: FileSprite[] }>('/api/IslandEditor/sprites').then(r => { registerSprites(r.sprites); setUploaded(r.sprites) }).catch(() => {})
        loadIsland(1)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
    // first load: island list, uploaded sprites, island 1's newest version

    const open = (id: number, v?: string) => {
        if (dirty && !confirm('Unsaved changes will be lost. Open anyway?')) return
        loadIsland(id, v === undefined ? undefined : v === CODE ? 0 : Number(v))
    }
    // v left out = that island's newest; ver 0 is falsy, so loadIsland
    // treats CODE as "the code version"

    const save = async () => {
        setStatus('saving…')
        try {
            const { ver } = await json<{ ver: number }>('/api/IslandEditor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) })
            const saved = { ...file, ver }
            savedRef.current = saved
            h.live(saved)
            setVersions(v => [...v, ver]); setPick(String(ver)); setOpened(String(ver))
            setStatus(`saved ${file.islandId}_ver${ver}.json, the game now loads this version`)
        } catch (e) {
            setStatus(`save failed: ${(e as Error).message}`)
        }
    }
    // always a new ver (the server picks max + 1); the opened one is kept

    const drop = (t: NonNullable<Tool>, x: number, y: number) => {
        if (t.kind === 'object') {
            const def = OBJECTS[t.def]
            if (!def) return
            const id = nextId(t.def, file.objects.map(o => o.id))
            const up = uploaded.find(u => u.key === t.def)
            h.commit(f => ({
                ...f,
                objects: [...f.objects, { id, def: t.def, x: Math.round(x - def.sprite.w / 2), y: Math.round(y - def.sprite.h), scale: 1 }],
                sprites: up && !f.sprites.some(s => s.key === up.key) ? [...f.sprites, up] : f.sprites,
            }))
            setSelection({ kind: 'object', id })
        } else {
            const id = nextId(t.npc, file.npcs.map(n => n.id))
            h.commit(f => ({ ...f, npcs: [...f.npcs, { id, npc: t.npc, x, y: Math.round(y - ENT_H / 2) }] }))
            setSelection({ kind: 'npc', id })
        }
    }
    // a drop puts the asset's base (bottom-center) on the clicked point and
    // selects it. An uploaded sprite is copied into the file's sprites, so
    // the game can draw it without the upload index

    const remove = useCallback(() => {
        if (!selection) return
        h.commit(f => selection.kind === 'object'
            ? { ...f, objects: f.objects.filter(o => o.id !== selection.id) }
            : { ...f, npcs: f.npcs.filter(n => n.id !== selection.id) })
        setSelection(null)
    }, [selection, h])

    const duplicate = useCallback(() => {
        if (!selection) return
        if (selection.kind === 'object') {
            const o = file.objects.find(x => x.id === selection.id)
            if (!o) return
            const id = nextId(o.def, file.objects.map(x => x.id))
            h.commit(f => ({ ...f, objects: [...f.objects, { ...o, id, x: o.x + 40, y: o.y + 40 }] }))
            setSelection({ kind: 'object', id })
        } else {
            const n = file.npcs.find(x => x.id === selection.id)
            if (!n) return
            const id = nextId(n.npc, file.npcs.map(x => x.id))
            h.commit(f => ({ ...f, npcs: [...f.npcs, { ...n, id, x: n.x + 40, y: n.y + 40 }] }))
            setSelection({ kind: 'npc', id })
        }
    }, [selection, file, h])
    // the copy lands 40 px right and down of the original, selected

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement
            if (el.closest('input, textarea, select')) return
            const mod = e.metaKey || e.ctrlKey
            if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) h.redo(); else h.undo() }
            else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); h.redo() }
            else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate() }
            else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save() }
            else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove() }
            else if (e.key === 'Escape') { setTool(null); setSelection(null) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    })
    // ⌘Z undo, ⇧⌘Z / ⌘Y redo, ⌘D duplicate, ⌘S save, ⌫ delete, Esc drop
    // the tool and selection. Ignored while typing in a field, so ⌫ edits text

    useEffect(() => {
        if (selection && !(selection.kind === 'object' ? file.objects : file.npcs).some(x => x.id === selection.id)) setSelection(null)
    }, [file, selection])
    // an undo can remove the selected item; clear the selection then

    const bar: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #ccc', flexWrap: 'wrap', background: '#f4f4f4' }
    const side: CSSProperties = { overflowY: 'auto', padding: 10, borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', gap: 10 }
    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'white', color: '#222', fontFamily: 'system-ui, sans-serif' }}>
            <div style={bar}>
                <strong>Island Editor</strong>
                <select value={islandId} onChange={e => { const id = Number(e.target.value); setIslandId(id); open(id) }}>
                    {(islands.length ? islands : [{ id: 1, name: 'island 1' }]).map(i => <option key={i.id} value={i.id}>{i.id} · {i.name}</option>)}
                </select>
                <select value={pick} onChange={e => setPick(e.target.value)}>
                    <option value={CODE}>code (islands.ts)</option>
                    {[...versions].reverse().map(v => <option key={v} value={v}>{islandId}_ver{v}.json</option>)}
                </select>
                <button onClick={() => open(islandId, pick)} disabled={pick === opened && !dirty}>Open</button>
                <span style={{ width: 1, height: 20, background: '#ccc' }} />
                <button onClick={h.undo} disabled={!h.canUndo}>↶ Undo</button>
                <button onClick={h.redo} disabled={!h.canRedo}>↷ Redo</button>
                <button onClick={save} style={{ fontWeight: 700 }}>Save as {islandId}_ver{(versions[versions.length - 1] ?? 0) + 1}</button>
                <span style={{ width: 1, height: 20, background: '#ccc' }} />
                <button onClick={() => setPhone(p => !p)} style={{ background: phone ? '#222' : undefined, color: phone ? 'white' : undefined }}>📱 {phone ? 'Back to editor' : 'Phone view'}</button>
                {!phone && <label style={{ fontSize: 13 }}>zoom <input type="range" min={0.2} max={1.5} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>}
                <span style={{ fontSize: 13, opacity: 0.8 }}>{dirty ? '● unsaved · ' : ''}{status}</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: phone ? '1fr' : '230px 1fr 320px', minHeight: 0 }}>
                {phone ? <div style={{ overflow: 'auto' }}><PhoneView file={file} quests={quests} /></div> : <>
                    <div style={side}><AssetBox tool={tool} onTool={setTool} uploaded={uploaded} onUploaded={(s, repoPath) => {
                        registerSprites([s])
                        setUploaded(u => [...u.filter(x => x.key !== s.key), s])
                        setTool({ kind: 'object', def: s.key })
                        if (repoPath) setStatus(`sprite saved to Supabase and ${repoPath}`)
                    }} /></div>
                    <div style={{ overflow: 'auto', background: '#888', padding: 16 }}>
                        <EditorCanvas file={file} zoom={zoom} selection={selection} tool={tool} onSelect={setSelection} onDrop={drop} begin={h.begin} live={h.live} />
                    </div>
                    <div style={{ ...side, borderRight: 'none', borderLeft: '1px solid #ccc' }}>
                        <SelectionPanel file={file} selection={selection} commit={h.commit} quests={quests} onDelete={remove} onDuplicate={duplicate}
                            onQuestSaved={q => setQuests(qs => [...qs.filter(x => x.id !== q.id), q].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)))} />
                        <IslandPanel file={file} commit={h.commit} />
                    </div>
                </>}
            </div>
        </div>
    )
}
// /IslandEditor (docs/island-editor.spec.json): top bar = island + version
// picker, undo / redo, save, phone-view switch; below it the asset box,
// the island canvas and the side panels. Laid out for a desktop browser;
// the phone view swaps the three columns for the phone frame
