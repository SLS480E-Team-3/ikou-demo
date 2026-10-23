// DEV
'use client'

import { CSSProperties, useEffect, useState } from "react"
import { NPC_SCRIPTS } from "@/components/Game/npcs/npcs"
import { sectionStart, type FileSection, type IslandFile } from "@/components/Game/islands/islandFile"
import type { Selection } from "./canvas"
import { LEVELS, QUEST_TYPES, type DoorTarget, type EditorQuest } from "./types"
import { KOSOADO, KOSOADO_GROUPS, groupOf, type KosoadoGroup } from "@/components/Game/kosoado" // imports: **+ kosoado**, mechanism: the matching quest's group dropdown

type Commit = (f: (p: IslandFile) => IslandFile, key?: string) => void

const box: CSSProperties = { border: '1px solid #ccc', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }
const row: CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }
const num: CSSProperties = { width: 64 }
const n = (v: string) => (v === '' || isNaN(Number(v)) ? 0 : Number(v))

export function SelectionPanel({ file, selection, commit, quests, onDelete, onDuplicate, onQuestSaved }: {
    file: IslandFile, selection: Selection, commit: Commit, quests: EditorQuest[],
    onDelete: () => void, onDuplicate: () => void, onQuestSaved: (q: EditorQuest) => void,
}) {
    if (!selection) return <div style={{ ...box, opacity: 0.7 }}>Nothing selected. Click an object, NPC or tile on the island.</div>
    const buttons = <div style={row}><button onClick={onDuplicate}>Duplicate (⌘D)</button><button onClick={onDelete}>Delete (⌫)</button></div>

    if (selection.kind === 'object') {
        const o = file.objects.find(x => x.id === selection.id)
        if (!o) return null
        const set = (patch: Partial<typeof o>, key: string) => commit(f => ({ ...f, objects: f.objects.map(x => x.id === o.id ? { ...x, ...patch } : x) }), `${o.id}:${key}`)
        const sign = o.interaction?.kind === 'sign' ? o.interaction.text : ''
        return (
            <div style={box}>
                <strong>object · {o.def}</strong>
                <span style={{ opacity: 0.7 }}>id {o.id}</span>
                <div style={row}>
                    <label>x <input type="number" value={o.x} onChange={e => set({ x: n(e.target.value) }, 'x')} style={num} /></label>
                    <label>y <input type="number" value={o.y} onChange={e => set({ y: n(e.target.value) }, 'y')} style={num} /></label>
                    <label>scale <input type="number" step={0.05} value={o.scale ?? 1} onChange={e => set({ scale: Math.max(0.05, n(e.target.value)) }, 'scale')} style={num} /></label>
                </div>
                <label style={row}>sign <input value={sign} placeholder="e.g. き (ki) = tree" onChange={e => set({ interaction: e.target.value ? { kind: 'sign', text: e.target.value } : undefined }, 'sign')} style={{ flex: 1 }} /></label>
                {buttons}
            </div>
        )
    }

    if (selection.kind === 'tile') {
        const tiles = file.tiles ?? []
        const i = tiles.findIndex(x => x.id === selection.id)
        const tile = tiles[i]
        if (!tile) return null
        const set = (patch: Partial<typeof tile>, key: string) => commit(f => ({ ...f, tiles: (f.tiles ?? []).map(x => x.id === tile.id ? { ...x, ...patch } : x) }), `${tile.id}:${key}`)
        const move = (by: number) => commit(f => {
            const t = [...(f.tiles ?? [])]; const j = i + by
            if (j < 0 || j >= t.length) return f
            ;[t[i], t[j]] = [t[j], t[i]]
            return { ...f, tiles: t }
        })
        return (
            <div style={box}>
                <strong>tile {i + 1} of {tiles.length}</strong>
                <span style={{ opacity: 0.7 }}>id {tile.id}</span>
                <div style={row}>
                    <label>x <input type="number" value={tile.x} onChange={e => set({ x: n(e.target.value) }, 'x')} style={num} /></label>
                    <label>y <input type="number" value={tile.y} onChange={e => set({ y: n(e.target.value) }, 'y')} style={num} /></label>
                </div>
                <div style={row}>path order
                    <button onClick={() => move(-1)} disabled={i === 0}>↑ earlier</button>
                    <button onClick={() => move(1)} disabled={i === tiles.length - 1}>↓ later</button>
                </div>
                <label style={row}>quest
                    <select value={tile.questId ?? ''} onChange={e => set({ questId: e.target.value ? Number(e.target.value) : undefined }, 'quest')}>
                        <option value="">none</option>
                        {quests.map(q => <option key={q.id} value={q.id}>#{q.id} {q.title}</option>)}
                    </select>
                </label>
                <QuestForm
                    key={tile.questId ?? 'new'}
                    islandId={file.islandId}
                    quest={quests.find(q => q.id === tile.questId)}
                    onSaved={q => { onQuestSaved(q); if (q.id !== tile.questId) set({ questId: q.id }, 'quest') }}
                />
                {buttons}
            </div>
        )
    }
    // a tile (issue #6): like an NPC, x / y (its center) and the quest it
    // starts, made or edited in the same QuestForm (title, level, type,
    // points, target). Path order swaps it with the tile before / after;
    // the path runs tile 1 -> 2 -> ... and a tile opens once the one before
    // it is cleared

    const npc = file.npcs.find(x => x.id === selection.id)
    if (!npc) return null
    const set = (patch: Partial<typeof npc>, key: string) => commit(f => ({ ...f, npcs: f.npcs.map(x => x.id === npc.id ? { ...x, ...patch } : x) }), `${npc.id}:${key}`)
    return (
        <div style={box}>
            <strong>npc · {NPC_SCRIPTS[npc.npc]?.name ?? npc.npc}</strong>
            <span style={{ opacity: 0.7 }}>id {npc.id}</span>
            <div style={row}>
                <label>x <input type="number" value={npc.x} onChange={e => set({ x: n(e.target.value) }, 'x')} style={num} /></label>
                <label>y <input type="number" value={npc.y} onChange={e => set({ y: n(e.target.value) }, 'y')} style={num} /></label>
            </div>
            <label style={row}>quest
                <select value={npc.questId ?? ''} onChange={e => set({ questId: e.target.value ? Number(e.target.value) : undefined }, 'quest')}>
                    <option value="">none (just talks)</option>
                    {quests.map(q => <option key={q.id} value={q.id}>#{q.id} {q.title}</option>)}
                </select>
            </label>
            <QuestForm
                key={npc.questId ?? 'new'}
                islandId={file.islandId}
                quest={quests.find(q => q.id === npc.questId)}
                onSaved={q => { onQuestSaved(q); if (q.id !== npc.questId) set({ questId: q.id }, 'quest') }}
            />
            {buttons}
        </div>
    )
}
// the selected item's exact values (spec F-1 / F-2 / F-3). Each field is
// one undo step per field (commit key = item id + field), so typing a
// number is undone at once, not digit by digit

const targetText = (t: EditorQuest['target']) => typeof t === 'string' ? t : ''
const listText = (t: EditorQuest['target'], k: keyof DoorTarget) => t && typeof t === 'object' && k in t ? (t as DoorTarget)[k].join(', ') : '' // test: **any object** -> **an object with that key**, mechanism: a matching target ({ group }) has no answer / decoys
const toList = (s: string) => s.split(/[,、]/).map(x => x.trim()).filter(Boolean)

function QuestForm({ islandId, quest, onSaved }: { islandId: number, quest?: EditorQuest, onSaved: (q: EditorQuest) => void }) {
    const [d, setD] = useState<EditorQuest>(quest ?? { island_id: islandId, title: '', reward_points: 10, level: 'vocab', quest_type: 'dodge', target: '' })
    const [answer, setAnswer] = useState(listText(quest?.target, 'answer'))
    const [decoys, setDecoys] = useState(listText(quest?.target, 'decoys'))
    const [msg, setMsg] = useState('')
    useEffect(() => { setMsg('') }, [quest])
    const door = d.quest_type === 'door'
    const matching = d.quest_type === 'matching'
    const [group, setGroup] = useState<KosoadoGroup>(groupOf(quest?.target) ?? 'pronoun')
    // the matching quest's こそあど group, saved as target { group }

    const save = async () => {
        const body: EditorQuest = { ...d, target: door ? { answer: toList(answer), decoys: toList(decoys) } : matching ? { group } : (targetText(d.target) || null) } // target: **+ matching -> { group }**, mechanism: the route stores it as is (kana stays null, it isn't a string)
        setMsg('saving…')
        const res = await fetch('/api/IslandEditor/quests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quest: body }) })
        const json = await res.json()
        if (!res.ok) { setMsg(json.error ?? 'save failed'); return }
        setMsg(`saved #${json.quest.id}`)
        onSaved(json.quest)
    }

    return (
        <div style={{ ...box, background: '#fafafa' }}>
            <strong>{quest ? `edit quest #${quest.id}` : 'new quest'}</strong>
            <label style={row}>title <input value={d.title} onChange={e => setD({ ...d, title: e.target.value })} style={{ flex: 1 }} /></label>
            <div style={row}>
                <label>level <input list="quest-levels" value={d.level ?? ''} onChange={e => setD({ ...d, level: e.target.value })} style={{ width: 90 }} /></label>
                <datalist id="quest-levels">{LEVELS.map(l => <option key={l} value={l} />)}</datalist>
                <label>type <select value={d.quest_type ?? 'dodge'} onChange={e => { const t = e.target.value as EditorQuest['quest_type']; setD({ ...d, quest_type: t, ...(t === 'matching' && (!d.level || d.level === 'vocab') ? { level: 'koSoADo' } : {}) }) }}> {/* onChange: **+ level koSoADo on matching**, mechanism: issue #7's level for these quests; only replaces an empty or the default vocab level */}
                    {QUEST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select></label>
                <label>points <input type="number" value={d.reward_points ?? 0} onChange={e => setD({ ...d, reward_points: n(e.target.value) })} style={{ width: 52 }} /></label>
            </div>
            {matching ? <label style={row}>target <select value={group} onChange={e => setGroup(e.target.value as KosoadoGroup)} style={{ flex: 1, minWidth: 0 }}>
                {KOSOADO_GROUPS.map(g => <option key={g} value={g}>{KOSOADO[g].name}: {KOSOADO[g].words.map(w => w.word).join('、')}</option>)}
            </select></label> : door ? <>
                <label style={row}>answer <input value={answer} placeholder="食べる, 歩く, 走る" onChange={e => setAnswer(e.target.value)} style={{ flex: 1 }} /></label>
                <label style={row}>decoys <input value={decoys} placeholder="行く, 寝る" onChange={e => setDecoys(e.target.value)} style={{ flex: 1 }} /></label>
            </> : <label style={row}>target <input value={targetText(d.target)} placeholder="あ" onChange={e => setD({ ...d, target: e.target.value })} style={{ width: 80 }} /></label>}
            {d.quest_type !== 'dodge' && !matching && <span style={{ color: '#a60' }}>Only dodge and matching quests run in this demo.</span>}
            <div style={row}><button onClick={save} disabled={!d.title}>{quest ? 'Save quest' : 'Create quest + assign'}</button>{msg && <span>{msg}</span>}</div>
        </div>
    )
}
// create or edit one quests row (spec F-3, D-12): level, quest type and
// target, saved straight to Supabase (quest content is not part of the
// island file, so undo covers which quest an NPC offers, not the row
// itself). door's target is { answer, decoys } typed as comma lists,
// matching's is { group } picked from the four こそあど groups; every other
// type takes one kana

export function IslandPanel({ file, commit }: { file: IslandFile, commit: Commit }) {
    const setSec = (i: number, patch: Partial<FileSection>, key: string) =>
        commit(f => ({ ...f, sections: f.sections.map((s, j) => j === i ? { ...s, ...patch } : s) }), `sec${i}:${key}`)
    const move = (i: number, by: number) => commit(f => {
        const s = [...f.sections]; const j = i + by
        if (j < 0 || j >= s.length) return f
        ;[s[i], s[j]] = [s[j], s[i]]
        return { ...f, sections: s }
    })
    const opt = (v: string) => v === '' ? undefined : n(v)

    return (
        <div style={box}>
            <strong>island {file.islandId}</strong>
            <label style={row}>bg color <input type="color" value={file.bgColor.startsWith('#') ? file.bgColor : '#90ee90'} onChange={e => commit(f => ({ ...f, bgColor: e.target.value }), 'bg')} /> <code>{file.bgColor}</code></label>
            <strong>sections (top → bottom)</strong>
            {file.sections.map((s, i) => (
                <div key={i} style={{ border: '1px solid #ddd', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={row}>
                        <input value={s.id} onChange={e => setSec(i, { id: e.target.value }, 'id')} style={{ width: 90 }} />
                        <input type="color" value={s.color} onChange={e => setSec(i, { color: e.target.value }, 'color')} />
                        <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                        <button onClick={() => move(i, 1)} disabled={i === file.sections.length - 1}>↓</button>
                        <button onClick={() => commit(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }))}>✕</button>
                    </div>
                    <div style={row}>
                        <label>start <input type="number" value={s.start ?? ''} placeholder={String(sectionStart(file.sections, i))} onChange={e => setSec(i, { start: opt(e.target.value) }, 'start')} style={num} /></label>
                        <label>end <input type="number" value={s.end} onChange={e => setSec(i, { end: n(e.target.value) }, 'end')} style={num} /></label>
                        <label>sep <input type="number" value={s.separator ?? ''} placeholder={String(sectionStart(file.sections, i))} onChange={e => setSec(i, { separator: opt(e.target.value) }, 'sep')} style={num} /></label>
                    </div>
                    <div style={row}>
                        <label><input type="checkbox" checked={!!s.solid} onChange={e => setSec(i, { solid: e.target.checked || undefined }, 'solid')} /> solid</label>
                        <label><input type="checkbox" checked={!!s.wave} onChange={e => setSec(i, { wave: e.target.checked || undefined }, 'wave')} /> wave</label>
                    </div>
                </div>
            ))}
            <button onClick={() => commit(f => {
                const last = f.sections[f.sections.length - 1]
                const top = last?.end ?? 0
                return { ...f, sections: [...f.sections, { id: `section-${f.sections.length + 1}`, end: Math.min(2000, top + 200), color: '#cccccc' }] }
            })}>+ section</button>
            <span style={{ opacity: 0.7 }}>Empty start = 0 or the end of the band above. Empty sep = start.</span>
        </div>
    )
}
// bg color and sections (spec F-4). start and separator show their
// fallback as the placeholder, so the dev sees where a band really starts.
// solid (blocks the player) and wave (moves like the shore) are the
// BgSection flags the ocean needs to play like the code's island 1
