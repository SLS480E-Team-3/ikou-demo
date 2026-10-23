'use client'

import { CSSProperties, ReactNode, useEffect, useReducer, useRef, useState } from "react"
import GameScene, { questBg } from "./gameScene"
import { TrainingHud } from "./training"
import { center } from "./dodgeTraining"
import { PLAYER_GAP, useInBetweenTraining, type IbQuestion } from "./inBetweenTraining"
import { inBetweenNpcs } from "../npcs/npcs"
import { BUBBLE_BG, BUBBLE_BOARDER, BUBBLE_BORDER_W } from "../Entity/dialogBubble"
import { stopBgm } from "../Entity/voice"
// a copy of matchingQuestIsland.tsx for the in-between quest (issue #12): the
// same square dojo with Ryuuko at its center, the sentence row and the
// player's word from useInBetweenTraining. No Hiroko tutorial and no hp bar

const TIMER_H = 8
const TIMER_TOP = 40
const FLASH_MS = 300
const FLASH_OPACITY = 0.6
const FLASH_COLOR = '#ff8a8a'
const CARD_TOP = 104
// same timer strip and damage flash as matchingQuestIsland.tsx; CARD_TOP: the
// sentence card's top, below the timer strip and the mute button

function Bar({ frac, color, style }: { frac: number, color: string, style: CSSProperties }) {
    return (
        <div style={{ position: 'absolute', zIndex: 2, boxSizing: 'border-box', border: `${BUBBLE_BORDER_W}px solid ${BUBBLE_BOARDER}`, background: BUBBLE_BG, pointerEvents: 'none', ...style }}>
            <div style={{ width: `${frac * 100}%`, height: '100%', background: color }} />
        </div>
    )
}

function Hud({ getHud, getSentence }: { getHud: () => TrainingHud, getSentence: () => { chars: string[], word: string } | undefined }) {
    const [, force] = useReducer((n: number) => n + 1, 0)
    useEffect(() => {
        let raf = requestAnimationFrame(function loop() { force(); raf = requestAnimationFrame(loop) })
        return () => cancelAnimationFrame(raf)
    }, [])
    const hud = getHud()
    const flash = FLASH_OPACITY * Math.max(0, 1 - (performance.now() - hud.hurtAt) / FLASH_MS)
    const sentence = getSentence()
    return (
        <>
            {sentence && <div style={{ position: 'absolute', zIndex: 2, top: `calc(var(--safe-top) + ${CARD_TOP}px)`, left: '5%', width: '90%', boxSizing: 'border-box', border: `${BUBBLE_BORDER_W}px solid ${BUBBLE_BOARDER}`, background: BUBBLE_BG, padding: '6px 8px', textAlign: 'center', color: 'black', pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: '0.5em' }}>{sentence.chars.join('')}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>your word: <b style={{ fontSize: 18 }}>{sentence.word}</b></div>
            </div>}
            {flash > 0 && <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: FLASH_COLOR, opacity: flash, pointerEvents: 'none' }} />}
            {hud.playing && <Bar frac={hud.timeFrac} color="cyan" style={{ top: `calc(var(--safe-top) + ${TIMER_TOP}px)`, left: '5%', width: '90%', height: TIMER_H }} />}
        </>
    )
}
// the matching quest's HUD: the cyan strip drains over the 5 s timer, a wrong
// gap flashes red; under it a card with the whole sentence (the floor row is
// wider than a phone shows) and the player's word

function Training({ w, h, onLeave, questions, sensitivity, children }: { w: number, h: number, onLeave: () => void, questions?: IbQuestion[], sensitivity?: number, children?: ReactNode }) {
    const t = useInBetweenTraining({ w, h, onLeave, questions })
    const c = center(w, h)
    return (
        <>
            <GameScene bgProps={{ ...questBg(w, h), y: c.y + PLAYER_GAP }} npcs={inBetweenNpcs(w, h, t.phase)} onChoice={t.onChoice} onTalkEnd={t.onTalkEnd} onTick={t.onTick} renderWorld={t.renderWorld} talkRequest={t.talkRequest} moveRequest={t.moveRequest} playerLabel={t.playerLabel} sensitivity={sensitivity} fitWhole />
            <Hud getHud={t.getHud} getSentence={t.getSentence} />
            {(t.phase === 'success' || t.phase === 'again') && children}
        </>
    )
}
// matchingQuestIsland.tsx's Training on useInBetweenTraining; fitWhole lets
// the player pinch out to read the whole sentence row

export function InBetweenQuestIsland({ onLeave, questions, sensitivity, children }: { onLeave: () => void, questions?: IbQuestion[], sensitivity?: number, children?: ReactNode }) {
    const boxRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ w: number, h: number }>()
    useEffect(() => { stopBgm() }, [])
    useEffect(() => {
        const h = Math.round(boxRef.current?.clientHeight || window.innerHeight)
        setSize({ w: h, h })
    }, [])
    return (
        <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', background: BUBBLE_BG }}>
            {size && <Training w={size.w} h={size.h} onLeave={onLeave} questions={questions} sensitivity={sensitivity}>{children}</Training>}
        </div>
    )
}
// same shell as MatchingQuestIsland; questions left out = IB_QUESTIONS (the
// issue's test sentence)
