'use client'

import { useEffect, useState } from "react" // imports: **useState** -> **+ useEffect**, mechanism: the clear animation starts from an effect
import { ENT_H } from "../Entity/entityRenderer"
import DialogBubble from "../Entity/dialogBubble"
import { BG_H } from "../Scene/gameScene"
import type { FileTile } from "./islandFile"

export const TILE_W = 42 // size: **32** -> **42**, reason: tiles 1.3x bigger, mechanism: 32 x 1.3 = 41.6, rounded to whole px
export const TILE_H = 26 // size: **20** -> **26**, mechanism: 20 x 1.3
// world px of a tile: the 8 x 5 art px files at about 5.2 world px per art
// pixel (1.3x the object sprites' 4)
export const TILE_IMG = { cleared: '/img/tile_cleared.png', available: '/img/tile-available.png', uncleared: '/img/tile_uncleared.png' } // images: **cleared, uncleared** -> **+ available**, mechanism: the next tile to play is red
// green = cleared, red = the next tile to play, gray = locked
const PATH_COLOR = '#58544c'
const PATH_W = 5 // width: **4** -> **5**, mechanism: about one art pixel of the 1.3x tiles (5.2)
// the path between two tiles: one art pixel of the gray in
// public/img/tile-path-ref.png
const TAP_PAD = 16
// world px around a tile that still counts as tapping it, so a finger does
// not have to land on the 42 x 26 sprite itself

export const lastReachable = (cleared: boolean[]) => {
    const i = cleared.findIndex(c => !c)
    return i === -1 ? cleared.length - 1 : i
}
// the furthest tile the player may walk to: the first one not cleared yet
// (tile s + 1 opens once tile s is cleared), or the last tile when all are

export const standAt = (t: FileTile) => ({ x: t.x, y: t.y - ENT_H / 2 })
// the player's center when standing on a tile: feet on the tile's center

const POP_MS = 400
const GROW_MS = 700
const OPEN_MS = 400
const ANIM_MS = POP_MS + GROW_MS + OPEN_MS
// the clear animation, one step after the other: the cleared tile pops as it
// turns green, then the path to the next tile grows solid, then the next
// tile pops in red
const TILE_KEYFRAMES = `
@keyframes tile-pop { 0% { transform: scale(1) } 40% { transform: scale(1.4) } 100% { transform: scale(1) } }
@keyframes tile-open { 0% { opacity: 0; transform: scale(1.4) } 100% { opacity: 1; transform: scale(1) } }
@keyframes path-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }`
// CSS keyframes, so the animation runs on its own while GameScene
// re-renders every frame (the elements keep their keys, so it plays once)

const SEEN_KEY = 'ikko-tiles-seen:'
const readSeen = (key: string): string[] => {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY + key) ?? '[]') } catch { return [] }
}
const writeSeen = (key: string, ids: string[]) => {
    try { localStorage.setItem(SEEN_KEY + key, JSON.stringify(ids)) } catch { /* private mode: the animation just plays again */ }
}
// the cleared tiles whose animation has already played, per island, in
// localStorage, so a tile cleared in a quest animates once when the player
// comes back to the island and not on every visit. Wrapped in try / catch:
// storage can be blocked, which only means the animation replays

export function TilePath({ tiles, cleared, anim = null }: { tiles: FileTile[], cleared: boolean[], anim?: number | null }) { // props: **+ anim**, mechanism: the index of the tile whose clear animation is playing
    const next = anim !== null ? anim + 1 : lastReachable(cleared)
    const tileBox = (t: FileTile) => ({ position: 'absolute' as const, left: t.x - TILE_W / 2, top: t.y - TILE_H / 2, width: TILE_W, height: TILE_H, imageRendering: 'pixelated' as const })
    const dashed = { position: 'absolute' as const, inset: 0, opacity: 0.45, background: `repeating-linear-gradient(90deg, ${PATH_COLOR} 0 ${PATH_W * 2}px, transparent ${PATH_W * 2}px ${PATH_W * 4}px)` }
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none' }}>
            <style>{TILE_KEYFRAMES}</style>
            {tiles.slice(1).map((t, i) => {
                const a = tiles[i]
                const len = Math.hypot(t.x - a.x, t.y - a.y)
                const open = !!cleared[i]
                const growing = anim === i
                return (
                    <div key={`path-${a.id}-${t.id}`} style={{
                        position: 'absolute', left: a.x, top: a.y - PATH_W / 2, width: len, height: PATH_W,
                        transformOrigin: `0 ${PATH_W / 2}px`, transform: `rotate(${Math.atan2(t.y - a.y, t.x - a.x)}rad)`,
                    }}>
                        {(!open || growing) && <div style={dashed} />}
                        {open && <div style={{ position: 'absolute', inset: 0, background: PATH_COLOR, transformOrigin: '0 50%', ...(growing && { animation: `path-grow ${GROW_MS}ms linear ${POP_MS}ms both` }) }} />}
                    </div>
                )
            })}
            {tiles.map((t, i) => {
                if (anim !== null && i === anim + 1) return (
                    <span key={t.id}>
                        <img src={TILE_IMG.uncleared} alt="" draggable={false} style={tileBox(t)} />
                        <img src={TILE_IMG.available} alt="" draggable={false} style={{ ...tileBox(t), animation: `tile-open ${OPEN_MS}ms ease-out ${POP_MS + GROW_MS}ms both` }} />
                    </span>
                )
                return <img key={t.id} src={cleared[i] ? TILE_IMG.cleared : i === next ? TILE_IMG.available : TILE_IMG.uncleared} alt="" draggable={false}
                    style={{ ...tileBox(t), ...(anim === i && { animation: `tile-pop ${POP_MS}ms ease-out both` }) }} />
            })}
        </div>
    )
}
// the tile path in world px, drawn under objects and entities (zIndex 0,
// like the footprints). Each path segment runs center to center inside a
// rotated bar: solid once the tile it leaves is cleared, a faint dashed
// line before that. Tiles draw over the bars: green cleared, red for the
// next one to play (the first uncleared), gray locked.
// anim (a tile index) plays its clear animation: that tile pops green, the
// solid line grows over the dashed one from it (scaleX from its left end,
// after POP_MS), then the next tile's red copy fades and pops in over its
// gray one (after POP_MS + GROW_MS). 'both' holds each step hidden before
// its delay and at its end after it

type Walk = { points: { x: number, y: number }[], key: number, to: number }

export const useTileWalk = (tiles: FileTile[], cleared: boolean[], onYes: (tile: FileTile) => void, seenKey: string) => { // args: **+ seenKey**, mechanism: which island's played animations to read / write
    const [anim, setAnim] = useState<number | null>(null)
    const [move, setMove] = useState<{ x: number, y: number, key: number }>()
    const last = anim !== null ? Math.min(anim, lastReachable(cleared)) : lastReachable(cleared) // last: **lastReachable** -> **held at the animating tile**, mechanism: the next tile can't be tapped until it has turned red
    const [atState, setAt] = useState(Math.max(0, last))
    const at = Math.min(atState, Math.max(0, tiles.length - 1))
    const [walk, setWalk] = useState<Walk | null>(null)
    const [asking, setAsking] = useState<number | null>(null)
    // at = the tile the player stands on (starts on the first uncleared
    // one), walk = the path being walked, asking = the tile whose yes / no
    // is showing. at is clamped, since the editor can delete tiles under it

    const clearedIds = tiles.filter((_, i) => cleared[i]).map(t => t.id)
    const idsKey = clearedIds.join(',')
    useEffect(() => {
        const seen = readSeen(seenKey)
        let fresh = -1
        tiles.forEach((t, i) => { if (cleared[i] && !seen.includes(t.id)) fresh = i })
        writeSeen(seenKey, clearedIds)
        if (fresh < 0) return
        setAnim(fresh)
        setAt(fresh)
        setMove({ ...standAt(tiles[fresh]), key: Date.now() })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seenKey, idsKey])
    useEffect(() => {
        if (anim === null) return
        const t = setTimeout(() => setAnim(null), ANIM_MS)
        return () => clearTimeout(t)
    }, [anim])
    // clear animation: when the cleared set has a tile not seen before (on
    // mount after a won quest, or a はい in the phone view), the newest such
    // tile animates, and the player is put on it (moveRequest; GameScene's
    // spawn is read once at mount, before this effect knew). The seen list is
    // rewritten to exactly the cleared tiles, so an un-cleared tile (phone
    // view reset) animates again next time. A separate effect ends the
    // animation after ANIM_MS, so a re-run of the first one can't strand it

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
        <TilePath tiles={tiles} cleared={cleared} anim={anim} />
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

    return { spawn: spot, sceneProps: { onTap, walkPath: walk ?? undefined, onArrive, renderWorld, moveRequest: move } } // sceneProps: **+ moveRequest**, mechanism: puts the player on the tile whose clear animation plays
}
// the tile-path controls for GameScene (issue #6): spawn is where the
// player starts (read by GameScene once at mount, through bgProps x / y),
// sceneProps go straight onto <GameScene>. onYes gets the tile whose はい
// was picked; the caller decides what that opens. seenKey names the island
// for the played-animation memory (e.g. game-1)
