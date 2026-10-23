'use client'

import { createElement, Fragment, useCallback, useEffect, useRef, useState } from "react"
import { TargetBubble } from "@/components/Game/Entity/charBlock"
import { lineMs, lineUrl, playLine, playSfx, preloadClips } from "@/components/Game/Entity/voice"
import { BUBBLE_BG, BUBBLE_BOARDER, BUBBLE_BORDER_W, BUBBLE_SHADOW } from "@/components/Game/Entity/dialogBubble"
import { ENT_H } from "@/components/Game/Entity/entityRenderer"
import { toDialogs } from "../npcs/toNPCProps"
import ryuuko from "../npcs/dialogs/ryuuko.json"
import { type PlayerBox } from "./gameScene"
import { ELENA, RYUUKO, type TrainingHud } from "./training"
import { center } from "./dodgeTraining"
// the in-between quest (issue #12), built on matchingTraining.ts: a sentence
// with one word missing is laid out on the dojo floor, one tile per character
// with an equal gap before, between and after them. The player carries the
// missing word, and when the 5 s timer runs out their feet must be in the gap
// where that word completes the sentence. This file must not import npcs.ts
// (npcs.ts imports IbPhase from here)

export type IbPhase = 'intro' | 'play' | 'success' | 'again'
// same phases as the matching quest: Ryuuko's rules talk, the run, success
// (Ryuuko, then Elena), and 'again' for her replay offer

export type IbQuestion = { before: string, word: string, after: string, romaji: string, en: string }
export const IB_QUESTIONS: IbQuestion[] = [
    { before: '私は', word: 'この', after: 'さかながすき', romaji: 'watashi wa kono sakana ga suki', en: 'I like this fish' },
]
// the test quest's sentences: the full sentence is before + word + after, the
// floor shows before + after and the player carries word. Only the issue's
// example for now

const charsOf = (q: IbQuestion) => [...Array.from(q.before), ...Array.from(q.after)]
const answerOf = (q: IbQuestion) => Array.from(q.before).length
// the floor's characters, and the gap the word belongs in: gap i is the one
// left of character i (0 = before the first, chars.length = after the last)

const TILE = 32
const GAP = 32
const ROW_DROP = 90
const SLOT_H = 64
const TILE_FONT = 20
// a character tile's size, the gap between tiles (wider than the 24 px player,
// so they fit in one), how far below Ryuuko's center the row sits, how tall a
// gap's standing slot is (centered on the row), and the tile's kana size

export const PLAYER_GAP = 50
// px in y from Ryuuko to the player when the sentence is shown: above the row

const FEET_IN = 4
// the "where the player stands" point, FEET_IN px above the body's bottom (as
// in matchingTraining.ts)

const ASK_MS = 800
const TIMER_MS = 5000
const RESULT_MS = 1200
const DAMAGE_SFX = '/_SFX/tookDamage.mp3'
// how long the sentence shows before the slots and timer, the timer, and the
// least time 正解！ / 違うわよ！ stays before the next sentence

type Step = 'ask' | 'pick' | 'result'

export const rowLayout = (w: number, h: number, n: number) => {
    const c = center(w, h)
    const left = c.x - (n * TILE + (n + 1) * GAP) / 2
    const y = c.y + ROW_DROP
    const tiles = Array.from({ length: n }, (_, i) => ({ x: left + GAP + i * (TILE + GAP), y, w: TILE, h: TILE }))
    const slots = Array.from({ length: n + 1 }, (_, i) => ({ x: left + i * (TILE + GAP), y: y + TILE / 2 - SLOT_H / 2, w: GAP, h: SLOT_H }))
    return { tiles, slots }
}
// the row centered under Ryuuko: n tiles and the n + 1 gaps around them
// (top-left world px). A slot is its gap stretched to SLOT_H, the area the
// player's feet must be in

type RunLine = 'mt-correct' | 'mt-wrong'
const lineOf = (cond: RunLine) => toDialogs(ryuuko).find(d => d.condition === cond)
// Ryuuko's verdicts are the matching quest's lines

export function useInBetweenTraining({ w, h, onLeave, questions = IB_QUESTIONS }: { w: number, h: number, onLeave?: () => void, questions?: IbQuestion[] }) {
    const [phase, setPhaseState] = useState<IbPhase>('intro')
    const phaseRef = useRef<IbPhase>('intro')
    const [talkRequest, setTalkRequest] = useState<{ npc: number, key: number } | undefined>(undefined)
    const [moveRequest, setMoveRequest] = useState<{ x: number, y: number, key: number } | undefined>(undefined)

    const current = useRef(0)
    const step = useRef<Step>('ask')
    const stepMs = useRef(0)
    const bubble = useRef('')
    const hurtAt = useRef(-Infinity)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const sizeRef = useRef({ w, h })
    sizeRef.current = { w, h }
    const onLeaveRef = useRef(onLeave)
    onLeaveRef.current = onLeave
    const questionsRef = useRef(questions)
    questionsRef.current = questions
    // matchingTraining.ts's layout

    const clearTimer = () => {
        if (timer.current !== undefined) clearTimeout(timer.current)
        timer.current = undefined
    }
    useEffect(() => clearTimer, [])

    const setPhase = useCallback((p: IbPhase) => {
        phaseRef.current = p
        setPhaseState(p)
        clearTimer()
    }, [])

    const talkTo = useCallback((npc: number) => setTalkRequest(r => ({ npc, key: (r?.key ?? 0) + 1 })), [])

    const setStep = (s: Step) => { step.current = s; stepMs.current = 0 }

    const ask = useCallback(() => {
        const q = questionsRef.current[current.current]
        if (!q) return
        bubble.current = ''
        setStep('ask')
        const c = center(sizeRef.current.w, sizeRef.current.h)
        setMoveRequest(r => ({ x: c.x, y: c.y + PLAYER_GAP, key: (r?.key ?? 0) + 1 }))
    }, [])
    // shows the sentence, puts the player back just below Ryuuko; onTick
    // brings the slots and timer out ASK_MS later

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

    const onTick = useCallback((dt: number, player: PlayerBox) => {
        if (phaseRef.current !== 'play') return
        stepMs.current += dt * 1000
        const since = stepMs.current
        if (step.current === 'ask') {
            if (since >= ASK_MS) setStep('pick')
            return
        }
        if (step.current !== 'pick' || since < TIMER_MS) return

        const q = questionsRef.current[current.current]
        const { slots } = rowLayout(sizeRef.current.w, sizeRef.current.h, charsOf(q).length)
        const feetY = player.y + player.h / 2 - FEET_IN
        const i = slots.findIndex(b => player.x >= b.x && player.x <= b.x + b.w && feetY >= b.y && feetY <= b.y + b.h)
        const right = i === answerOf(q)
        // the gap the player's feet are in when time is up (-1 = none, wrong)
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
            if (current.current >= questionsRef.current.length) { setPhase('success'); talkTo(RYUUKO) }
            else ask()
        }, Math.max(RESULT_MS, said))
        // right: 正解！ then the next sentence (or success); wrong: the flash,
        // damage sound and 違うわよ！, then the same sentence again
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

    const onTalkEnd = useCallback((npc: number) => {
        if (npc === RYUUKO && phaseRef.current === 'success') setPhase('again')
    }, [setPhase])
    // same choices and talk ending as the matching quest

    const renderWorld = useCallback(() => {
        if (phaseRef.current !== 'play') return null
        const { w, h } = sizeRef.current
        const c = center(w, h)
        const q = questionsRef.current[Math.min(current.current, questionsRef.current.length - 1)]
        const chars = charsOf(q)
        const { tiles, slots } = rowLayout(w, h, chars.length)
        const showSlots = step.current !== 'ask'
        return createElement(Fragment, null,
            ...(bubble.current ? [createElement(TargetBubble, { key: 'say', kana: bubble.current, x: c.x, y: c.y, h: ENT_H, w: bubble.current.length * 32 + 16 })] : []),
            ...(showSlots ? slots.map((b, i) => createElement('div', {
                key: `slot-${i}`,
                style: { position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, boxSizing: 'border-box', zIndex: 0, border: '2px dashed #2f5bb7', background: 'rgba(47, 91, 183, 0.15)', pointerEvents: 'none' },
            })) : []),
            ...tiles.map((b, i) => createElement('div', {
                key: `tile-${i}`,
                style: {
                    position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, boxSizing: 'border-box', zIndex: 0,
                    border: `${BUBBLE_BORDER_W}px solid ${BUBBLE_BOARDER}`, background: BUBBLE_BG, boxShadow: `2px 2px 0 ${BUBBLE_SHADOW}`,
                    color: 'black', fontSize: TILE_FONT, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none',
                },
            }, chars[i])),
        )
    }, [])
    // the sentence's tiles (always, while playing), the dashed blue gaps once
    // the timer is out, and Ryuuko's 正解！ / 違うわよ！ bubble. zIndex 0 keeps the row under the player and
    // Ryuuko, who are drawn at their bottom edge

    const getHud = useCallback((): TrainingHud => {
        const pick = phaseRef.current === 'play' && step.current === 'pick'
        const left = pick ? Math.max(0, TIMER_MS - stepMs.current) : TIMER_MS
        const q = questionsRef.current[Math.min(current.current, questionsRef.current.length - 1)]
        return {
            target: q.word,
            romaji: q.romaji,
            current: current.current,
            quota: questionsRef.current.length,
            hp: 1,
            maxHP: 1,
            secondsLeft: Math.ceil(left / 1000),
            timeFrac: left / TIMER_MS,
            playing: pick,
            hurtAt: hurtAt.current,
        }
    }, [])
    // the HUD snapshot: playing only while the timer runs, like the matching quest

    const getSentence = useCallback((): { chars: string[], word: string } | undefined => {
        if (phaseRef.current !== 'play') return undefined
        const q = questionsRef.current[Math.min(current.current, questionsRef.current.length - 1)]
        return { chars: charsOf(q), word: q.word }
    }, [])
    // the floor's characters and the player's word for the shell's top card:
    // the row is wider than a phone shows, so the whole sentence is read there

    const playerLabel = useCallback((): string | undefined =>
        phaseRef.current === 'play' ? questionsRef.current[Math.min(current.current, questionsRef.current.length - 1)].word : undefined, [])
    // the player's name tag shows their word while playing

    return { phase, onTick, onChoice, onTalkEnd, renderWorld, getHud, getSentence, playerLabel, talkRequest, moveRequest }
}
// usage: like useMatchingTraining; the island builds its NPCs with
// inBetweenNpcs(w, h, phase) and draws the timer from getHud()
