'use client'

import { createElement, Fragment, useCallback, useEffect, useRef, useState } from "react"
import { KANA_FONT, TargetBubble } from "@/components/Game/Entity/charBlock"
import { lineMs, lineUrl, playLine, playSfx, preloadClips } from "@/components/Game/Entity/voice"
import { ENT_H } from "@/components/Game/Entity/entityRenderer"
import { toDialogs } from "../npcs/toNPCProps"
import ryuuko from "../npcs/dialogs/ryuuko.json"
import { type PlayerBox } from "./gameScene"
import { ELENA, RYUUKO, type TrainingHud } from "./training"
import { center } from "./dodgeTraining"
// the matching quest (issue #8), built like leftRightTraining.ts in ikko,
// on the dodge quest's square dojo: Ryuuko at the center says a word in her
// bubble, three colored areas appear under her with English meanings, and
// after a 3 s timer the player has to be standing in the right one. This
// file must not import npcs.ts (npcs.ts imports MtPhase from here)

export type MtPhase = 'intro' | 'play' | 'success' | 'again'
// Ryuuko's rules talk, the run, then success (Ryuuko, then Elena);
// 'again': いいえ to Elena after success, Ryuuko offers a replay. No fail
// phase in the prototype: a wrong pick asks the same word again

export type MatchQuestion = { word: string, romaji: string, answer: string, decoys: [string, string] }
export const MT_QUESTIONS: MatchQuestion[] = [
    { word: 'これ', romaji: 'kore', answer: 'this', decoys: ['that', 'which'] },
]
// one run's words, in order. Prototype: これ only; それ / あれ / どれ and the
// other こそあど groups (この, こう, こんな...) come next, with their own
// English labels

const AREA_COLORS = [
    { fill: '#c8302a', frame: '#7e1d19' },
    { fill: '#2f5bb7', frame: '#1d3a75' },
    { fill: '#3a9a4a', frame: '#22602d' },
]
// red / blue / green, left to right, each with a darker frame (red and blue
// are the door quest's colors)

const AREA_W = 72
const AREA_H = 90
const AREA_GAP = 8
const AREA_DROP = 90
const AREA_FRAME = 4
const AREA_ALPHA = 0.55
// the three areas: size, gap between them, how far below Ryuuko's center
// their top edge sits, frame width, and fill opacity (so the floor and the
// player's footprints still show through). 3 x 72 + 2 x 8 = 232 px, inside
// the ~250 world px a 375 px phone shows at ZOOM_DEF 1.5

export const PLAYER_GAP = 50
// px in y from Ryuuko to the player when a word is asked: between her and
// the areas, so every area is about the same walk

const FEET_IN = 4
// the "where the player stands" point sits FEET_IN px above the bottom of
// their body (player is center + size)

const ASK_MS = 800
const TIMER_MS = 3000
const RESULT_MS = 1200
const DAMAGE_SFX = '/_SFX/tookDamage.mp3'
// how long the word shows before the areas appear, the timer once they're
// out, and the least time Ryuuko's 正解！ / 違うわよ！ stays before the next word

type Step = 'ask' | 'pick' | 'result'
// one word's steps: the word in her bubble, the areas + timer, her verdict

export const areaBoxes = (w: number, h: number) => {
    const c = center(w, h)
    const left = c.x - (AREA_W * 3 + AREA_GAP * 2) / 2
    return [0, 1, 2].map(i => ({ x: left + i * (AREA_W + AREA_GAP), y: c.y + AREA_DROP, w: AREA_W, h: AREA_H }))
}
// the three areas' boxes in world px (top-left), centered under Ryuuko

type RunLine = 'mt-correct' | 'mt-wrong'
const lineOf = (cond: RunLine) => toDialogs(ryuuko).find(d => d.condition === cond)
// Ryuuko's in-run line: jp[0] is the kana shown in her bubble, audio[0] the clip

const shuffle = <T,>(a: T[]): T[] => {
    const b = [...a]
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
    return b
}

export function useMatchingTraining({ w, h, onLeave }: { w: number, h: number, onLeave?: () => void }) {
    const [phase, setPhaseState] = useState<MtPhase>('intro')
    const phaseRef = useRef<MtPhase>('intro')
    const [talkRequest, setTalkRequest] = useState<{ npc: number, key: number } | undefined>(undefined)
    const [moveRequest, setMoveRequest] = useState<{ x: number, y: number, key: number } | undefined>(undefined)

    const current = useRef(0)
    const step = useRef<Step>('ask')
    const stepAt = useRef(0)
    const labels = useRef<string[]>([])
    const bubble = useRef('')
    const hurtAt = useRef(-Infinity)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const sizeRef = useRef({ w, h })
    sizeRef.current = { w, h }
    const onLeaveRef = useRef(onLeave)
    onLeaveRef.current = onLeave
    // same layout as the other trainings: phase is state (the NPC list depends
    // on it) mirrored in phaseRef, the per-frame state lives in refs.
    // step / stepAt: where the current word is and when that step began.
    // labels: the areas' English, shuffled per word (on はい, not during
    // render). bubble: the text in Ryuuko's bubble

    const clearTimer = () => {
        if (timer.current !== undefined) clearTimeout(timer.current)
        timer.current = undefined
    }
    useEffect(() => clearTimer, [])

    const setPhase = useCallback((p: MtPhase) => {
        phaseRef.current = p
        setPhaseState(p)
        clearTimer()
    }, [])

    const talkTo = useCallback((npc: number) => setTalkRequest(r => ({ npc, key: (r?.key ?? 0) + 1 })), [])

    const setStep = (s: Step) => { step.current = s; stepAt.current = performance.now() }

    const ask = useCallback(() => {
        const q = MT_QUESTIONS[current.current]
        if (!q) return
        labels.current = shuffle([q.answer, ...q.decoys])
        bubble.current = q.word
        setStep('ask')
        const c = center(sizeRef.current.w, sizeRef.current.h)
        setMoveRequest(r => ({ x: c.x, y: c.y + PLAYER_GAP, key: (r?.key ?? 0) + 1 }))
    }, [])
    // puts the word in Ryuuko's bubble and the player back just below her;
    // onTick brings the areas out ASK_MS later

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
    // Ryuuko's verdict in her bubble and voice; returns the clip's length so
    // the next word waits for it (0 for a clip that isn't rendered yet)

    const onTick = useCallback((_dt: number, player: PlayerBox) => {
        if (phaseRef.current !== 'play') return
        const since = performance.now() - stepAt.current
        if (step.current === 'ask') {
            if (since >= ASK_MS) setStep('pick')
            return
        }
        if (step.current !== 'pick' || since < TIMER_MS) return
        // the areas are out once ASK_MS has passed; nothing is checked until
        // the 3 s timer runs out, so the player can walk between them

        const q = MT_QUESTIONS[current.current]
        const boxes = areaBoxes(sizeRef.current.w, sizeRef.current.h)
        const feetY = player.y + player.h / 2 - FEET_IN
        const i = boxes.findIndex(b => player.x >= b.x && player.x <= b.x + b.w && feetY >= b.y && feetY <= b.y + b.h) // test: **the body's center** -> **the feet**, reason: the player looked inside an area but its center was still above it, mechanism: a point FEET_IN px above the body's bottom edge, at its center x
        const right = i >= 0 && labels.current[i] === q.answer
        // the area the player's feet stand in when time is up (-1 = none,
        // which counts as wrong)
        setStep('result')
        let said = 0
        if (right) {
            current.current++
            said = say('mt-correct')
        }
        else {
            hurtAt.current = performance.now()
            playSfx(DAMAGE_SFX)
            said = say('mt-wrong')
        }
        clearTimer()
        timer.current = setTimeout(() => {
            timer.current = undefined
            if (phaseRef.current !== 'play') return
            if (current.current >= MT_QUESTIONS.length) { setPhase('success'); talkTo(RYUUKO) }
            else ask()
        }, Math.max(RESULT_MS, said))
        // right: 正解！ then the next word (or success after the last one);
        // wrong: the flash, damage sound and 違うわよ！, then the same word again
    }, [ask, setPhase, talkTo])

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
    // はい to Ryuuko starts / replays the run, はい to Elena leaves; いいえ to
    // Elena after success moves to 'again'

    const onTalkEnd = useCallback((npc: number) => {
        if (npc === RYUUKO && phaseRef.current === 'success') setPhase('again')
    }, [setPhase])
    // Ryuuko's おつかれさま！ ending moves to her replay offer, like dodge

    const renderWorld = useCallback(() => {
        if (phaseRef.current !== 'play') return null
        const { w, h } = sizeRef.current
        const c = center(w, h)
        const showAreas = step.current !== 'ask'
        return createElement(Fragment, null,
            createElement(TargetBubble, { key: 'say', kana: bubble.current, x: c.x, y: c.y, h: ENT_H, w: Math.max(KANA_FONT, bubble.current.length * KANA_FONT) + 16 }),
            ...(showAreas ? areaBoxes(w, h).map((b, i) => createElement('div', {
                key: `area-${i}`,
                style: {
                    position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, boxSizing: 'border-box', zIndex: 0,
                    background: AREA_COLORS[i].fill, opacity: AREA_ALPHA, border: `${AREA_FRAME}px solid ${AREA_COLORS[i].frame}`,
                    color: 'white', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                },
            }, labels.current[i])) : []),
        )
    }, [])
    // Ryuuko's bubble (the word, then 正解！ / 違うわよ！), widened to fit the
    // text, and the three areas once the word has been shown. zIndex 0 keeps
    // the areas under the player and Ryuuko, who are drawn at their bottom edge

    const getHud = useCallback((): TrainingHud => {
        const pick = phaseRef.current === 'play' && step.current === 'pick'
        const left = pick ? Math.max(0, TIMER_MS - (performance.now() - stepAt.current)) : TIMER_MS
        const q = MT_QUESTIONS[Math.min(current.current, MT_QUESTIONS.length - 1)]
        return {
            target: q.word,
            romaji: q.romaji,
            current: current.current,
            quota: MT_QUESTIONS.length,
            hp: 1,
            maxHP: 1,
            secondsLeft: Math.ceil(left / 1000),
            timeFrac: left / TIMER_MS,
            playing: pick,
            hurtAt: hurtAt.current,
        }
    }, [])
    // the HUD snapshot: playing only while the timer runs, so the shell draws
    // the timer strip just then. No hp in the prototype

    const playerLabel = useCallback((): string | undefined =>
        phaseRef.current === 'play' ? `${current.current}/${MT_QUESTIONS.length}` : undefined, [])

    return { phase, onTick, onChoice, onTalkEnd, renderWorld, getHud, playerLabel, talkRequest, moveRequest }
}
// usage: like useDodgeTraining; the island builds its NPCs with
// matchingNpcs(w, h, phase) and draws the timer from getHud()
