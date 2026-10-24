'use client'

import { createElement, Fragment, useCallback, useEffect, useRef, useState } from "react"
import { KANA_FONT, TargetBubble } from "@/components/Game/Entity/charBlock"
import { lineMs, lineUrl, playLine, playSfx, preloadClips } from "@/components/Game/Entity/voice"
import { ENT_H } from "@/components/Game/Entity/entityRenderer"
import { toDialogs } from "../npcs/toNPCProps"
import ryuuko from "../npcs/dialogs/ryuuko.json"
import { DOJO_SIDE, type BgSection, type WalkPath } from "./gameScene"
import { ELENA, RYUUKO, type TrainingHud } from "./training"
import { center } from "./dodgeTraining"
import { questionsFor } from "./matchingTraining"
import type { KosoadoGroup } from "../kosoado"
// the bridge quest: the player and Ryuuko stand at the bottom left of the
// dojo, three meaning areas wait at the top, and a strip of spikes lies
// between. Ryuuko says a word, the player draws a line from where they stand
// to an area, and walks it as a bridge. The right area: they make it across.
// A wrong one: the bridge vanishes over the spikes, the screen blacks out,
// and they start over next to Ryuuko with the same word. Words and meanings
// are the matching quest's (kosoado.ts groups). This file must not import
// npcs.ts (npcs.ts imports BrPhase from here)

export type BrPhase = 'intro' | 'play' | 'success' | 'again'
// same phases as the matching quest: Ryuuko's rules talk, the run, success
// (Ryuuko, then Elena), and her replay offer

const AREA_COLORS = [
    { fill: '#c8302a', frame: '#7e1d19' },
    { fill: '#2f5bb7', frame: '#1d3a75' },
    { fill: '#3a9a4a', frame: '#22602d' },
]
// red / blue / green, left to right, as in matchingTraining.ts

const AREA_W = 72
const AREA_H = 64
const AREA_GAP = 8
const AREA_TOP = 278
const AREA_FRAME = 4
// the three areas: size, gap between them, how far above the dojo's center
// their top edge sits, frame width. They are centered over the player's
// start, since the camera follows the player: 232 px fits the ~250 world px
// a 375 px phone shows at ZOOM_DEF 1.5. Top to bottom (areas to the
// player's feet) is ~340 px, more than the ~270 px above the player a phone
// shows, so cameraFocus frames the middle while the word and the timer run

const GAP_TOP = 200 // GAP_TOP: **112 (2 rows)** -> **200 (4 rows)**, mechanism: 4 x SPIKE_PX = 176 px of spikes above GAP_BOTTOM; AREA_TOP moved up with it (14 px of floor between)
const GAP_BOTTOM = 24
const SPIKE_PX = 44
const SPIKE_IMG = '/img/spike.png'
const PIT_COLOR = '#3a2616'
// the spike strip: from GAP_TOP to GAP_BOTTOM px above the center (four
// rows of spikes), wall to wall. spike.png (11 px) is drawn 4x, the dojo's 4 world px per art pixel,
// over a dark pit

export const RYUUKO_SPOT = { dx: -112, dy: 10 }
export const PLAYER_SPOT = { dx: -72, dy: 44 }
// Ryuuko and the player's start, from the center: the bottom left, below the
// spikes, with the player in Ryuuko's talk range. Hiroko stands HIROKO_DX
// left of Ryuuko in 'intro' (bridgeQuestIsland.tsx), so she isn't on the player

const FEET_IN = 4
const FEET_DY = ENT_H / 2 - FEET_IN
// a drawn point is where the feet go; the player's center is FEET_DY above it

const STEP_PX = 6
const LINE_W = 10
// stroke points closer than STEP_PX world px are dropped; the bridge's width

const ASK_MS = 800
const TIMER_MS = 10000
const RESULT_MS = 1200
export const BLACK_IN_MS = 300
export const BLACK_MS = 1600
const DROP_PX = 24
const DAMAGE_SFX = '/_SFX/tookDamage.mp3'
// the word alone before the areas appear, the drawing timer (default), the
// least time 正解！ stays, the blackout's fade-in and whole length, and how
// far the player drops into the spikes when the bridge vanishes

type Step = 'ask' | 'draw' | 'walk' | 'fall' | 'result'
// one word's steps: the word, drawing (the timer runs), walking the bridge,
// falling and the blackout (wrong), the verdict

type Pt = { x: number, y: number }

export const spikeSection = (w: number, h: number): BgSection => ({ id: 'spikes', ...bridgeLayout(w, h).gap, color: PIT_COLOR, solid: true })
// the spike strip as a solid ground section, added to questBg's sections:
// the player can't walk into it in intro / success / again. A WalkPath
// ignores solids, so the bridge still crosses it during the run

export const bridgeLayout = (w: number, h: number) => {
    const c = center(w, h)
    const start = { x: c.x + PLAYER_SPOT.dx, y: c.y + PLAYER_SPOT.dy }
    const left = start.x - (AREA_W * 3 + AREA_GAP * 2) / 2
    return {
        areas: [0, 1, 2].map(i => ({ x: left + i * (AREA_W + AREA_GAP), y: c.y - AREA_TOP, w: AREA_W, h: AREA_H })),
        gap: { x: DOJO_SIDE, y: c.y - GAP_TOP, w: w - DOJO_SIDE * 2, h: GAP_TOP - GAP_BOTTOM },
        ryuuko: { x: c.x + RYUUKO_SPOT.dx, y: c.y + RYUUKO_SPOT.dy },
        start,
    }
}
// the quest's boxes in world px (top-left), and Ryuuko's spot and the
// player's start (centers)

type RunLine = 'mt-correct' | 'mt-wrong'
const lineOf = (cond: RunLine) => toDialogs(ryuuko).find(d => d.condition === cond)

const shuffle = <T,>(a: T[]): T[] => {
    const b = [...a]
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
    return b
}

const inBox = (p: Pt, b: { x: number, y: number, w: number, h: number }) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h

export function useBridgeTraining({ w, h, onLeave, group = 'pronoun', timerMs = TIMER_MS }: { w: number, h: number, onLeave?: () => void, group?: KosoadoGroup, timerMs?: number }) {
    const [phase, setPhaseState] = useState<BrPhase>('intro')
    const phaseRef = useRef<BrPhase>('intro')
    const timerRef = useRef(timerMs)
    timerRef.current = timerMs
    const [talkRequest, setTalkRequest] = useState<{ npc: number, key: number } | undefined>(undefined)
    const [moveRequest, setMoveRequest] = useState<{ x: number, y: number, key: number } | undefined>(undefined)
    const [walkPath, setWalkPath] = useState<WalkPath | undefined>(undefined)

    const current = useRef(0)
    const step = useRef<Step>('ask')
    const stepMs = useRef(0)
    const labels = useRef<string[]>([])
    const bubble = useRef('')
    const stroke = useRef<Pt[]>([])
    const drawing = useRef(false)
    const bridge = useRef<Pt[]>([])
    const walkRight = useRef(false)
    const fallFrom = useRef<Pt>({ x: 0, y: 0 })
    const blackAt = useRef(-Infinity)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const worldEl = useRef<HTMLDivElement | null>(null)
    const sizeRef = useRef({ w, h })
    sizeRef.current = { w, h }
    const onLeaveRef = useRef(onLeave)
    onLeaveRef.current = onLeave
    const questionsRef = useRef({ group, list: questionsFor(group) })
    if (questionsRef.current.group !== group) questionsRef.current = { group, list: questionsFor(group) }
    // the matching hook's layout: phase is state mirrored in phaseRef, the
    // per-frame state lives in refs. stroke: the line being drawn (feet, world
    // px); bridge: the line being walked, the player's start first. walkRight:
    // whether it ends in the right area; fallFrom: where a wrong one breaks
    // (a player center). blackAt:
    // when the blackout began (performance.now). worldEl: an invisible div
    // covering the world, whose screen rect turns a finger into world px

    const clearTimer = () => {
        if (timer.current !== undefined) clearTimeout(timer.current)
        timer.current = undefined
    }
    useEffect(() => clearTimer, [])

    const setPhase = useCallback((p: BrPhase) => {
        phaseRef.current = p
        setPhaseState(p)
        clearTimer()
    }, [])

    const talkTo = useCallback((npc: number) => setTalkRequest(r => ({ npc, key: (r?.key ?? 0) + 1 })), [])
    const setStep = (s: Step) => { step.current = s; stepMs.current = 0 }
    const later = (ms: number, fn: () => void) => {
        clearTimer()
        timer.current = setTimeout(() => { timer.current = undefined; if (phaseRef.current === 'play') fn() }, ms)
    }

    const toStart = () => {
        const s = bridgeLayout(sizeRef.current.w, sizeRef.current.h).start
        setMoveRequest(r => ({ x: s.x, y: s.y, key: (r?.key ?? 0) + 1 }))
    }

    const ask = useCallback(() => {
        const q = questionsRef.current.list[current.current]
        if (!q) return
        labels.current = shuffle([q.answer, ...shuffle(q.pool).slice(0, 2)])
        bubble.current = q.word
        stroke.current = []
        bridge.current = []
        drawing.current = false
        setStep('ask')
        toStart()
    }, [])
    // the word in Ryuuko's bubble, a new draw of meanings, no line, and the
    // player back at the start; onTick brings the areas out ASK_MS later

    const startRun = useCallback(() => {
        current.current = 0
        preloadClips([...(['mt-correct', 'mt-wrong'] as RunLine[]).flatMap(c => { const d = lineOf(c); return d?.audio[0] ? lineUrl('ryuuko', d.audio[0]).split('\n') : [] }), DAMAGE_SFX])
        setPhase('play')
        ask()
    }, [setPhase, ask])

    const say = (cond: RunLine): number => {
        const d = lineOf(cond)
        if (!d) return 0
        bubble.current = d.jp[0]
        const url = lineUrl('ryuuko', d.audio[0])
        playLine(url)
        return lineMs(url)
    }

    const failAt = useRef(0)
    const failSaid = useRef(0)
    const fail = useCallback((drop: boolean) => {
        setStep('fall')
        bridge.current = []
        stroke.current = []
        drawing.current = false
        blackAt.current = performance.now()
        playSfx(DAMAGE_SFX)
        failAt.current = performance.now()
        failSaid.current = say('mt-wrong')
        if (!drop) later(BLACK_IN_MS, () => { toStart(); later(Math.max(BLACK_MS, failSaid.current) - BLACK_IN_MS, ask) })
    }, [ask])
    // wrong: the bridge is gone, damage sound, 違うわよ！ and the blackout; the
    // player is put back at the start while the screen is black, and the same
    // word is asked again once it clears. With drop (a wrong bridge) the
    // player is still falling, so onArrive does both once they land

    const onTick = useCallback((dt: number) => {
        if (phaseRef.current !== 'play') return
        stepMs.current += dt * 1000
        if (step.current === 'ask' && stepMs.current >= ASK_MS) setStep('draw')
        else if (step.current === 'draw' && stepMs.current >= timerRef.current) fail(false)
    }, [fail])
    // the timer counts frame time and only runs while drawing; running out
    // with no bridge counts as wrong

    const toWorld = (cx: number, cy: number): Pt | null => {
        const r = worldEl.current?.getBoundingClientRect()
        if (!r || !r.width) return null
        return { x: (cx - r.left) / r.width * sizeRef.current.w, y: (cy - r.top) / r.height * sizeRef.current.h }
    }
    // a screen px point in world px: worldEl covers the world's w x h, so its
    // rect already holds the camera's offset and zoom

    const strokeStart = useCallback((cx: number, cy: number) => {
        if (step.current !== 'draw') return
        const p = toWorld(cx, cy)
        if (!p) return
        drawing.current = true
        stroke.current = [p]
    }, [])

    const strokeMove = useCallback((cx: number, cy: number) => {
        if (!drawing.current || step.current !== 'draw') return
        const p = toWorld(cx, cy)
        const last = stroke.current[stroke.current.length - 1]
        if (p && (!last || Math.hypot(p.x - last.x, p.y - last.y) >= STEP_PX)) stroke.current.push(p)
    }, [])

    const strokeEnd = useCallback(() => {
        if (!drawing.current || step.current !== 'draw') return
        drawing.current = false
        const pts = stroke.current
        const { areas, gap, start } = bridgeLayout(sizeRef.current.w, sizeRef.current.h)
        const end = pts[pts.length - 1]
        const i = end ? areas.findIndex(b => inBox(end, b)) : -1
        if (i < 0) { stroke.current = []; return }
        // a line that doesn't end in an area is wiped, and the player can
        // draw again while the timer lasts

        const line = [{ x: start.x, y: start.y + FEET_DY }, ...pts]
        const right = labels.current[i] === questionsRef.current.list[current.current].answer
        const mid = gap.y + gap.h / 2
        const cut = line.findIndex(p => p.y <= mid)
        const crossAt = (a: Pt, b: Pt): Pt => ({ x: a.x + (b.x - a.x) * (a.y - mid) / ((a.y - b.y) || 1), y: mid })
        const walked = right || cut < 1 ? line : [...line.slice(0, cut), crossAt(line[cut - 1], line[cut])]
        // the bridge always starts at the player's feet. A wrong one is only
        // walked up to where it crosses the middle of the spikes: the point on
        // the first segment that goes over that line, so a sparse stroke (a
        // fast flick, a mouse) breaks there too and not at its next point
        bridge.current = line
        stroke.current = []
        const points = walked.map(p => ({ x: p.x, y: p.y - FEET_DY }))
        walkRight.current = right
        fallFrom.current = points[points.length - 1]
        setStep('walk')
        setWalkPath(r => ({ points, key: (r?.key ?? 0) + 1 }))
    }, [])

    const onArrive = useCallback(() => {
        if (phaseRef.current !== 'play') return
        if (step.current === 'walk' && walkRight.current) {
            setStep('result')
            current.current++
            const said = say('mt-correct')
            later(Math.max(RESULT_MS, said), () => {
                if (current.current >= questionsRef.current.list.length) { toStart(); setPhase('success'); talkTo(RYUUKO) } // success: **player stays at the last area** -> **+ toStart()**, reason: the spikes are solid outside the run, mechanism: puts them back next to Ryuuko and Elena, below the spikes
                else ask()
            })
            return
        }
        if (step.current === 'walk') {
            const p = fallFrom.current
            fail(true)
            setWalkPath(r => ({ points: [{ x: p.x, y: p.y + DROP_PX }], key: (r?.key ?? 0) + 1 }))
            return
        }
        if (step.current === 'fall') {
            const since = performance.now() - failAt.current
            later(Math.max(0, BLACK_IN_MS - since), () => {
                toStart()
                later(Math.max(0, Math.max(BLACK_MS, failSaid.current) - (performance.now() - failAt.current)), ask)
            })
        }
    }, [ask, fail, setPhase, talkTo])
    // the end of a walk: across on the right bridge (正解！, then the next word
    // or success); on a wrong one the bridge vanishes mid-gap and the player
    // drops into the spikes as the screen goes black; once they land (and the
    // screen is black) they go back to the start, and the same word comes
    // back when the blackout ends. Moving them only after the drop's own
    // walk ends keeps that walk from pulling them back into the spikes

    const onChoice = useCallback((npc: number, choice: number) => {
        const p = phaseRef.current
        if (npc === RYUUKO) {
            if (choice === 0 && (p === 'intro' || p === 'again')) startRun()
            return
        }
        if (npc === ELENA) {
            if (choice === 0) onLeaveRef.current?.()
            else if (p === 'success') setPhase('again')
        }
    }, [startRun, setPhase])

    const onTalkEnd = useCallback((npc: number) => {
        if (npc === RYUUKO && phaseRef.current === 'success') setPhase('again')
    }, [setPhase])
    // same choices as the matching quest

    const renderWorld = useCallback(() => {
        const { w, h } = sizeRef.current
        const { areas, gap, ryuuko: r } = bridgeLayout(w, h)
        const play = phaseRef.current === 'play'
        const showAreas = play && step.current !== 'ask'
        const line = step.current === 'draw' ? stroke.current : bridge.current
        const pts = line.map(p => `${p.x},${p.y}`).join(' ')
        return createElement(Fragment, null,
            createElement('div', { key: 'world', ref: (el: HTMLDivElement | null) => { worldEl.current = el }, style: { position: 'absolute', left: 0, top: 0, width: w, height: h, pointerEvents: 'none' } }),
            createElement('div', {
                key: 'gap',
                style: {
                    position: 'absolute', left: gap.x, top: gap.y, width: gap.w, height: gap.h, zIndex: 0, pointerEvents: 'none',
                    backgroundColor: PIT_COLOR, backgroundImage: `url(${SPIKE_IMG})`, backgroundSize: SPIKE_PX, backgroundRepeat: 'repeat', imageRendering: 'pixelated',
                },
            }),
            ...(showAreas ? areas.map((b, i) => createElement('div', {
                key: `area-${i}`,
                style: {
                    position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, boxSizing: 'border-box', zIndex: 0,
                    background: AREA_COLORS[i].fill, border: `${AREA_FRAME}px solid ${AREA_COLORS[i].frame}`,
                    color: 'white', fontSize: 12, fontWeight: 'bold', lineHeight: 1.2, textAlign: 'center', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                },
            }, labels.current[i])) : []),
            ...(play && line.length > 1 ? [createElement('svg', { key: 'bridge', width: w, height: h, style: { position: 'absolute', left: 0, top: 0, zIndex: 1, pointerEvents: 'none', overflow: 'visible' } },
                createElement('polyline', { points: pts, fill: 'none', stroke: '#6b4424', strokeWidth: LINE_W, strokeLinecap: 'round', strokeLinejoin: 'round' }),
                createElement('polyline', { points: pts, fill: 'none', stroke: '#c08a4a', strokeWidth: LINE_W - 4, strokeLinecap: 'butt', strokeLinejoin: 'round', strokeDasharray: '5 3' }),
            )] : []),
            ...(play ? [createElement(TargetBubble, { key: 'say', kana: bubble.current, x: r.x, y: r.y, h: ENT_H, w: Math.max(KANA_FONT, bubble.current.length * KANA_FONT) + 16 })] : []),
        )
    }, [])
    // the world children: the invisible world div, the spike strip (always,
    // so the dojo looks the same in intro), the areas once the word has shown,
    // the line as wooden planks (the stroke while drawing, then the bridge),
    // and Ryuuko's bubble. The spikes and areas are zIndex 0, under the
    // player and NPCs; the planks are 1, over the spikes

    const getHud = useCallback((): TrainingHud & { blackAt: number } => {
        const draw = phaseRef.current === 'play' && step.current === 'draw'
        const left = draw ? Math.max(0, timerRef.current - stepMs.current) : timerRef.current
        const list = questionsRef.current.list
        const q = list[Math.min(current.current, list.length - 1)]
        return {
            target: q.word,
            romaji: q.romaji,
            current: current.current,
            quota: list.length,
            hp: 1,
            maxHP: 1,
            secondsLeft: Math.ceil(left / 1000),
            timeFrac: left / timerRef.current,
            playing: draw,
            hurtAt: -Infinity,
            blackAt: blackAt.current,
        }
    }, [])
    // the HUD snapshot: playing (the timer strip and the drawing layer) only
    // while drawing; blackAt for the shell's blackout

    const cameraFocus = useCallback((): { x: number, y: number } | undefined => {
        if (phaseRef.current !== 'play' || (step.current !== 'ask' && step.current !== 'draw')) return undefined
        const { areas, start } = bridgeLayout(sizeRef.current.w, sizeRef.current.h)
        return { x: start.x, y: (areas[0].y + start.y + ENT_H / 2) / 2 }
    }, [])
    // the camera point while the word and the timer run: halfway between the
    // areas' top and the player's feet, so both are on a phone screen. Walking
    // and the rest follow the player as usual

    const playerLabel = useCallback((): string | undefined =>
        phaseRef.current === 'play' ? `${current.current}/${questionsRef.current.list.length}` : undefined, [])

    return { phase, onTick, onChoice, onTalkEnd, onArrive, renderWorld, getHud, cameraFocus, playerLabel, talkRequest, moveRequest, walkPath, strokeStart, strokeMove, strokeEnd }
}
// usage: like useMatchingTraining, plus walkPath / onArrive for GameScene's
// tap mode (on during 'play', so the stick never moves the player) and the
// stroke handlers for the shell's drawing layer
