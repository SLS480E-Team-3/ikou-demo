// DEV
'use client'

import { PointerEvent as ReactPointerEvent, useRef } from "react"
import { BG_H, BG_W } from "@/components/Game/Scene/gameScene"
import { ENT_H, ENT_W } from "@/components/Game/Entity/entityRenderer"
import { OBJECTS } from "@/components/Game/Object/objects"
import { NPC_SCRIPTS } from "@/components/Game/npcs/npcs"
import { toBgSections, type IslandFile } from "@/components/Game/islands/islandFile"
import { TILE_H, TILE_W, TilePath } from "@/components/Game/islands/tiles"

export type ItemKind = 'object' | 'npc' | 'tile'
export type Selection = { kind: ItemKind, id: string } | null // kind: **'object' | 'npc'** -> **ItemKind (+ 'tile')**, mechanism: tiles are selected, moved and deleted like NPCs
export type Tool = { kind: 'object', def: string } | { kind: 'npc', npc: string } | { kind: 'tile' } | null // tool: **+ { kind: 'tile' }**, mechanism: the asset box's tiles/ entry drops a tile

type Drag = { moved: boolean } & (
    | { mode: 'move', kind: ItemKind, id: string, dx: number, dy: number }
    | { mode: 'scale', id: string, cx: number, bottom: number }
) // drag: **+ moved**, mechanism: the undo step opens on the first move, so a plain click adds none

type Props = {
    file: IslandFile,
    zoom: number,
    selection: Selection,
    tool: Tool,
    onSelect: (s: Selection) => void,
    onDrop: (tool: NonNullable<Tool>, x: number, y: number) => void,
    begin: () => void,
    live: (f: (p: IslandFile) => IslandFile) => void,
}

const MIN_SCALE = 0.05
const HANDLE = 14
const SELECTED_Z = 100_000
// the selected item draws above everything (zIndex: **bottom edge** ->
// **SELECTED_Z when selected**, reason: a lower object covered the scale
// handle, mechanism: world y never reaches 100 000)
// smallest scale the corner handle goes down to, and the handle's size in
// screen px (it is drawn at 1 / zoom so it stays the same size on screen)

export default function EditorCanvas({ file, zoom, selection, tool, onSelect, onDrop, begin, live }: Props) {
    const worldRef = useRef<HTMLDivElement>(null)
    const drag = useRef<Drag | null>(null)

    const toWorld = (e: { clientX: number, clientY: number }) => {
        const r = worldRef.current!.getBoundingClientRect()
        return { x: Math.round((e.clientX - r.left) / zoom), y: Math.round((e.clientY - r.top) / zoom) }
    }
    // a pointer position as world px: the world div is scaled by zoom with
    // its top-left at the rect's top-left

    const onBackground = (e: ReactPointerEvent) => {
        if (e.button !== 0) return
        const p = toWorld(e)
        if (tool) onDrop(tool, p.x, p.y)
        else onSelect(null)
    }
    // empty ground: drop the picked asset there, or clear the selection

    const startMove = (e: ReactPointerEvent, kind: ItemKind, id: string, ox: number, oy: number) => {
        if (e.button !== 0) return
        e.stopPropagation()
        const p = toWorld(e)
        if (tool) { onDrop(tool, p.x, p.y); return }
        onSelect({ kind, id })
        drag.current = { moved: false, mode: 'move', kind, id, dx: p.x - ox, dy: p.y - oy } // begin: **on pointerdown** -> **on the first move (onMove)**, reason: a click to select made an empty undo step, mechanism: moved flags whether begin() ran
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }
    // pointerdown on an item selects it and opens one undo step for the drag
    // (begin); the moves after it only update the state (live). dx / dy keep
    // the grab point under the pointer. With a tool picked, the click drops
    // instead, so assets can be placed on top of others

    const startScale = (e: ReactPointerEvent, id: string, cx: number, bottom: number) => {
        e.stopPropagation()
        drag.current = { moved: false, mode: 'scale', id, cx, bottom }
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }
    // the corner handle scales around the sprite's bottom-center (where it
    // stands, like place() in islands.ts), so it grows up and outward

    const onMove = (e: ReactPointerEvent) => {
        const d = drag.current
        if (!d) return
        const p = toWorld(e)
        if (!d.moved) { d.moved = true; begin() }
        if (d.mode === 'move') {
            const x = Math.round(p.x - d.dx), y = Math.round(p.y - d.dy) // x, y: **p - d** -> **rounded**, mechanism: the code's maps have fractional spots (place() halves sprite sizes); a moved item lands on whole px
            live(f => d.kind === 'object'
                ? { ...f, objects: f.objects.map(o => o.id === d.id ? { ...o, x, y } : o) }
                : d.kind === 'npc'
                ? { ...f, npcs: f.npcs.map(n => n.id === d.id ? { ...n, x, y } : n) }
                : { ...f, tiles: (f.tiles ?? []).map(t => t.id === d.id ? { ...t, x, y } : t) }) // move: **object or npc** -> **+ tile**, mechanism: a tile's x / y is its center, moved the same way as an NPC's
        } else {
            live(f => ({
                ...f, objects: f.objects.map(o => {
                    if (o.id !== d.id) return o
                    const def = OBJECTS[o.def]
                    if (!def) return o
                    const s = Math.max(MIN_SCALE, Math.round(((p.x - d.cx) * 2 / def.sprite.w) * 100) / 100)
                    return { ...o, scale: s, x: Math.round(d.cx - def.sprite.w * s / 2), y: Math.round(d.bottom - def.sprite.h * s) }
                }),
            }))
        }
    }
    const onUp = () => { drag.current = null }

    const sections = toBgSections(file.sections)
    return (
        <div style={{ width: BG_W * zoom, height: BG_H * zoom, position: 'relative', flexShrink: 0, cursor: tool ? 'crosshair' : 'default' }}>
            <div
                ref={worldRef}
                onPointerDown={onBackground}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                style={{ position: 'absolute', left: 0, top: 0, width: BG_W, height: BG_H, transform: `scale(${zoom})`, transformOrigin: '0 0', background: file.bgColor, overflow: 'hidden', touchAction: 'none' }}
            >
                {sections.map((s, i) => (
                    <div key={s.id + i} style={{ position: 'absolute', left: 0, top: s.y, width: BG_W, height: s.h, background: s.color, pointerEvents: 'none' }}>
                        {i > 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderTop: `${2 / zoom}px dashed rgba(0,0,0,0.5)` }} />}
                        <span style={{ position: 'absolute', left: 8 / zoom, top: 4 / zoom, fontSize: 12 / zoom, color: 'rgba(0,0,0,0.55)', fontFamily: 'monospace' }}>{s.id}{s.solid ? ' (solid)' : ''}{s.wave ? ' (wave)' : ''}</span>
                    </div>
                ))}
                {/* ground bands as flat colors, each from its separator down to
                    its end; the dashed line is the separator (the game draws a
                    dithered border there) */}

                <TilePath tiles={file.tiles ?? []} cleared={[]} />
                {(file.tiles ?? []).map((t, i) => {
                    const sel = selection?.kind === 'tile' && selection.id === t.id
                    return (
                        <div key={t.id} onPointerDown={e => startMove(e, 'tile', t.id, t.x, t.y)}
                            style={{ position: 'absolute', left: t.x - TILE_W / 2, top: t.y - TILE_H / 2, width: TILE_W, height: TILE_H, zIndex: sel ? SELECTED_Z : SELECTED_Z - 1, outline: sel ? `${2 / zoom}px solid #ff3d7f` : undefined, cursor: 'move' }}>
                            <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: 11 / zoom, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.85)', padding: `0 ${3 / zoom}px`, pointerEvents: 'none' }}>
                                {i + 1}{t.questId ? ` · Q${t.questId}` : ''}
                            </span>
                        </div>
                    )
                })}
                {/* tiles: the game's TilePath drawn as all uncleared (dashed
                    path), with a grab box over each tile and its path number
                    (1 = the first tile) and quest id under it. The grab boxes sit
                    above every object (SELECTED_Z - 1), so a tile under a tree
                    can still be picked */}

                {file.objects.map(o => {
                    const def = OBJECTS[o.def]
                    const s = o.scale ?? 1
                    const w = (def?.sprite.w ?? 64) * s, h = (def?.sprite.h ?? 64) * s
                    const sel = selection?.kind === 'object' && selection.id === o.id
                    return (
                        <div key={o.id} onPointerDown={e => startMove(e, 'object', o.id, o.x, o.y)}
                            style={{ position: 'absolute', left: o.x, top: o.y, width: w, height: h, zIndex: sel ? SELECTED_Z : Math.round(o.y + h), outline: sel ? `${2 / zoom}px solid #ff3d7f` : undefined, background: def ? undefined : 'rgba(255,0,0,0.4)', cursor: 'move' }}>
                            {def && <img src={def.sprite.src} alt={def.sprite.alt} draggable={false} style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block', pointerEvents: 'none' }} />}
                            {o.interaction?.kind === 'sign' && <span style={{ position: 'absolute', left: 0, top: -14 / zoom, fontSize: 11 / zoom, background: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>🪧</span>}
                            {sel && def && <div onPointerDown={e => startScale(e, o.id, o.x + w / 2, o.y + h)}
                                style={{ position: 'absolute', right: -HANDLE / zoom / 2, bottom: -HANDLE / zoom / 2, width: HANDLE / zoom, height: HANDLE / zoom, background: '#ff3d7f', border: `${1 / zoom}px solid white`, cursor: 'nwse-resize' }} />}
                        </div>
                    )
                })}
                {/* objects at their top-left, layered by bottom edge like the
                    game; an unknown def shows as a red box so it can still be
                    selected and deleted. 🪧 marks a sign */}

                {file.npcs.map(n => {
                    const script = NPC_SCRIPTS[n.npc]
                    const sel = selection?.kind === 'npc' && selection.id === n.id
                    return (
                        <div key={n.id} onPointerDown={e => startMove(e, 'npc', n.id, n.x, n.y)}
                            style={{ position: 'absolute', left: n.x - ENT_W / 2, top: n.y - ENT_H / 2, width: ENT_W, height: ENT_H, background: script?.color ?? 'gray', zIndex: sel ? SELECTED_Z : Math.round(n.y + ENT_H / 2), outline: sel ? `${2 / zoom}px solid #ff3d7f` : `${1 / zoom}px solid black`, cursor: 'move' }}>
                            <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: 11 / zoom, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.85)', padding: `0 ${3 / zoom}px`, pointerEvents: 'none' }}>
                                {script?.name ?? n.npc}{n.questId ? ` · Q${n.questId}` : ''}
                            </span>
                        </div>
                    )
                })}
                {/* NPC bodies centered on x / y (the game's anchor), with the
                    name and the id of the quest they offer */}
            </div>
        </div>
    )
}
// the world at `zoom`: an outer box sized to the scaled world (so the
// scroll area is right) and the 1400 x 2000 world inside it, scaled with a
// css transform so everything is laid out in world px
