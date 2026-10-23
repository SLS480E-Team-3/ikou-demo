'use client'

import { useState } from "react"
import { ENT_H } from "../Entity/entityRenderer"
import DialogBubble from "../Entity/dialogBubble"
import { BG_H } from "../Scene/gameScene"
import type { FileTile } from "./islandFile"

export const TILE_W = 32
export const TILE_H = 20
// world px of a tile: the 8 x 5 art px files at 4 world px per art pixel,
// the same scale as the object sprites
export const TILE_IMG = { cleared: '/img/tile_cleared.png', uncleared: '/img/tile_uncleared.png' }
const PATH_COLOR = '#58544c'
const PATH_W = 4
// the path between two tiles: one art pixel (4 world px) of the gray in
// public/img/tile-path-ref.png
const TAP_PAD = 16
// world px around a tile that still counts as tapping it, so a finger does
// not have to land on the 32 x 20 sprite itself

export const lastReachable = (cleared: boolean[]) => {
    const i = cleared.findIndex(c => !c)
    return i === -1 ? cleared.length - 1 : i
}
// the furthest tile the player may walk to: the first one not cleared yet
// (tile s + 1 opens once tile s is cleared), or the last tile when all are

export const standAt = (t: FileTile) => ({ x: t.x, y: t.y - ENT_H / 2 })
// the player's center when standing on a tile: feet on the tile's center

export function TilePath({ tiles, cleared }: { tiles: FileTile[], cleared: boolean[] }) {
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none' }}>
            {tiles.slice(1).map((t, i) => {
                const a = tiles[i]
                const len = Math.hypot(t.x - a.x, t.y - a.y)
                const open = !!cleared[i]
                return (
                    <div key={`path-${a.id}-${t.id}`} style={{
                        position: 'absolute', left: a.x, top: a.y - PATH_W / 2, width: len, height: PATH_W,
                        transformOrigin: `0 ${PATH_W / 2}px`, transform: `rotate(${Math.atan2(t.y - a.y, t.x - a.x)}rad)`,
                        background: open ? PATH_COLOR : `repeating-linear-gradient(90deg, ${PATH_COLOR} 0 ${PATH_W * 2}px, transparent ${PATH_W * 2}px ${PATH_W * 4}px)`,
                        opacity: open ? 1 : 0.45,
                    }} />
                )
            })}
            {tiles.map((t, i) => (
                <img key={t.id} src={cleared[i] ? TILE_IMG.cleared : TILE_IMG.uncleared} alt="" draggable={false}
                    style={{ position: 'absolute', left: t.x - TILE_W / 2, top: t.y - TILE_H / 2, width: TILE_W, height: TILE_H, imageRendering: 'pixelated' }} />
            ))}
        </div>
    )
}
// the tile path in world px, drawn under objects and entities (zIndex 0,
// like the footprints). Each path segment runs center to center as a
// rotated bar: solid once the tile it leaves is cleared, a faint dashed
// line before that. Tiles draw over the bars, green when cleared

type Walk = { points: { x: number, y: number }[], key: number, to: number }

export const useTileWalk = (tiles: FileTile[], cleared: boolean[], onYes: (tile: FileTile) => void) => {
    const last = lastReachable(cleared)
    const [atState, setAt] = useState(Math.max(0, last))
    const at = Math.min(atState, Math.max(0, tiles.length - 1))
    const [walk, setWalk] = useState<Walk | null>(null)
    const [asking, setAsking] = useState<number | null>(null)
    // at = the tile the player stands on (starts on the first uncleared
    // one), walk = the path being walked, asking = the tile whose yes / no
    // is showing. at is clamped, since the editor can delete tiles under it

    const onTap = ({ x, y, choice }: { x: number, y: number, choice: number | null }) => {
        if (asking !== null) {
            if (choice === null) return
            setAsking(null)
            if (choice === 0) onYes(tiles[asking])
            return
        }
        if (walk) return
        const t = tiles.findIndex(t => Math.abs(x - t.x) <= TILE_W / 2 + TAP_PAD && Math.abs(y - t.y) <= TILE_H / 2 + TAP_PAD)
        if (t < 0 || t > last) return
        if (t === at) { setAsking(t); return }
        const step = t > at ? 1 : -1
        const points = []
        for (let i = at + step; i !== t + step; i += step) points.push(standAt(tiles[i]))
        setWalk({ points, key: Date.now(), to: t })
    }
    // a tap while asking only counts on はい / いいえ. Otherwise a tap on a
    // reachable tile walks there along the path, through every tile in
    // between (forward or back); a tap on the tile the player is on asks
    // again. Locked tiles (past the first uncleared one) ignore taps

    const onArrive = () => {
        if (!walk) return
        setAt(walk.to)
        setWalk(null)
        setAsking(walk.to)
    }

    const spot = tiles[at] && standAt(tiles[at])
    const tile = asking !== null ? tiles[asking] : undefined
    const renderWorld = () => <>
        <TilePath tiles={tiles} cleared={cleared} />
        {tile && spot && (
            <div style={{ position: 'absolute', left: 0, top: 0, zIndex: BG_H + 1 }}>
                <DialogBubble x={spot.x} y={spot.y} h={ENT_H}
                    dialogs={[cleared[asking!] ? { condition: 'quest', jp: 'もういちど？', en: 'Play again?' } : { condition: 'quest', jp: 'はじめる？', en: 'Start?' }]}
                    choices={[{ jp: 'はい', en: 'Yes' }, { jp: 'いいえ', en: 'No' }]} />
            </div>
        )}
    </>
    // the path, plus the yes / no bubble over the player once they arrive.
    // The wrapper's zIndex BG_H + 1 lifts it over every bottom-edge zIndex,
    // like the sign bubbles. The choices are hit-tested by GameScene and come
    // back through onTap's choice

    return { spawn: spot, sceneProps: { onTap, walkPath: walk ?? undefined, onArrive, renderWorld } }
}
// the tile-path controls for GameScene (issue #6): spawn is where the
// player starts (read by GameScene once at mount, through bgProps x / y),
// sceneProps go straight onto <GameScene>. onYes gets the tile whose はい
// was picked; the caller decides what that opens
