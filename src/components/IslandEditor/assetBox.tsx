// DEV
'use client'

import { CSSProperties, FormEvent, useState } from "react"
import { OBJECTS } from "@/components/Game/Object/objects"
import { NPC_SCRIPTS } from "@/components/Game/npcs/npcs"
import type { FileSprite } from "@/components/Game/islands/islandFile"
import { TILE_IMG } from "@/components/Game/islands/tiles"
import type { Tool } from "./canvas"

type Props = {
    tool: Tool,
    onTool: (t: Tool) => void,
    uploaded: FileSprite[],
    onUploaded: (s: FileSprite, repoPath?: string) => void,
}

const item = (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '4px 6px', border: 'none', textAlign: 'left',
    background: active ? '#ff3d7f' : 'transparent', color: active ? 'white' : 'inherit', cursor: 'pointer', fontSize: 13,
})
const thumb: CSSProperties = { width: 28, height: 28, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }

export default function AssetBox({ tool, onTool, uploaded, onUploaded }: Props) {
    const builtIn = Object.keys(OBJECTS).filter(k => !uploaded.some(u => u.key === k))
    const pick = (t: NonNullable<Tool>) => onTool(JSON.stringify(t) === JSON.stringify(tool) ? null : t)
    // clicking the picked asset again puts it down (no tool)

    return (
        <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>asset box/</div>
            <details open>
                <summary style={{ cursor: 'pointer' }}>npcs/</summary>
                {Object.entries(NPC_SCRIPTS).map(([key, s]) => (
                    <button key={key} style={item(tool?.kind === 'npc' && tool.npc === key)} onClick={() => pick({ kind: 'npc', npc: key })}>
                        <span style={{ ...thumb, width: 14, height: 22, background: s.color, border: '1px solid black' }} />{s.name}
                    </button>
                ))}
            </details>
            <details open>
                <summary style={{ cursor: 'pointer' }}>tiles/</summary>
                <button style={item(tool?.kind === 'tile')} onClick={() => pick({ kind: 'tile' })}>
                    <img src={TILE_IMG.uncleared} alt="" style={thumb} />tile
                </button>
            </details>
            {/* tiles/: one entry; each drop adds the next tile of the path */}
            <details open>
                <summary style={{ cursor: 'pointer' }}>objects/</summary>
                {[...builtIn.map(k => ({ key: k, src: OBJECTS[k].sprite.src })), ...uploaded.map(u => ({ key: u.key, src: u.sprite.src, up: true }))].map(o => (
                    <button key={o.key} style={item(tool?.kind === 'object' && tool.def === o.key)} onClick={() => pick({ kind: 'object', def: o.key })}>
                        <img src={o.src} alt="" style={thumb} />{o.key}{'up' in o && <span style={{ opacity: 0.6 }}> (uploaded)</span>}
                    </button>
                ))}
                <Upload onUploaded={onUploaded} />
            </details>
            <p style={{ opacity: 0.7, marginTop: 8 }}>Pick an asset, then click the island to drop it. Esc or click it again to stop.</p>
        </div>
    )
}
// the asset box (spec D-5): npcs/ = the NPC dialog files, objects/ = the
// object catalog plus uploaded sprites. Picking one sets the canvas tool

function Upload({ onUploaded }: { onUploaded: Props['onUploaded'] }) {
    const [file, setFile] = useState<File | null>(null)
    const [key, setKey] = useState('')
    const [size, setSize] = useState({ w: 0, h: 0 })
    const [msg, setMsg] = useState('')

    const choose = (f: File | null) => {
        setFile(f)
        if (!f) return
        setKey(f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
        const img = new Image()
        img.onload = () => { setSize({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(img.src) }
        img.src = URL.createObjectURL(f)
    }
    // a picked file prefills the key from its name and w / h from the image's
    // own size, both editable before upload

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        if (!file) return
        if (OBJECTS[key]) { setMsg(`"${key}" is already a built-in object`); return }
        setMsg('uploading…')
        const body = new FormData()
        body.set('file', file); body.set('key', key); body.set('w', String(size.w)); body.set('h', String(size.h))
        const res = await fetch('/api/IslandEditor/sprites', { method: 'POST', body })
        const json = await res.json()
        if (!res.ok) { setMsg(json.error ?? 'upload failed'); return }
        onUploaded(json.sprite, json.repoPath)
        setMsg(json.repoPath ? `uploaded, also saved to ${json.repoPath}` : 'uploaded to Supabase')
        setFile(null)
    }

    const num: CSSProperties = { width: 56 }
    return (
        <form onSubmit={submit} style={{ marginTop: 8, padding: 6, border: '1px dashed #999', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong>upload sprite</strong>
            <input type="file" accept="image/png,image/webp,image/jpeg,image/gif" onChange={e => choose(e.target.files?.[0] ?? null)} />
            {file && <>
                <label>key <input value={key} onChange={e => setKey(e.target.value)} style={{ width: 120 }} /></label>
                <label>w <input type="number" value={size.w} onChange={e => setSize(s => ({ ...s, w: Number(e.target.value) }))} style={num} />
                    {' '}h <input type="number" value={size.h} onChange={e => setSize(s => ({ ...s, h: Number(e.target.value) }))} style={num} /></label>
                <button type="submit">upload</button>
            </>}
            {msg && <span style={{ opacity: 0.8 }}>{msg}</span>}
        </form>
    )
}
// sprite upload (spec F-11): key (a-z, 0-9, -) is the def name objects are
// placed by, w / h its world size at scale 1. The route stores it in
// Supabase, and in public/img/uploads/ too when run with npm run dev
