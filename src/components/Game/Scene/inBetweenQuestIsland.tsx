'use client'

import { ReactNode, useEffect, useReducer, useRef, useState } from "react"
import TimerClock from "./timerClock"
import GameScene, { questBg } from "./gameScene"
import { TrainingHud, useQuestZoom } from "./training"
import { center } from "./dodgeTraining"
import { PLAYER_GAP, useInBetweenTraining, type IbQuestion } from "./inBetweenTraining"
import { inBetweenNpcs } from "../npcs/npcs"
import { BUBBLE_BG, BUBBLE_BOARDER, BUBBLE_BORDER_W } from "../Entity/dialogBubble"
import { stopBgm } from "../Entity/voice"
import { HIROKO_DX, useMergedTalk, useTutorial, type TutorialProps } from "./tutorial" // imports: **+ tutorial**, mechanism: Hiroko's in-between tutorial, as in matchingQuestIsland.tsx
// a copy of matchingQuestIsland.tsx for the in-between quest (issue #12): the
// same square dojo with Ryuuko at its center, the sentence row and the
// player's word from useInBetweenTraining, Hiroko's tutorial in 'intro', and
// no hp bar

const FLASH_MS = 300
const FLASH_OPACITY = 0.6
const FLASH_COLOR = '#ff8a8a'
const CARD_TOP = 164 // CARD_TOP: **104** -> **164**, reason: the 140 px timer clock at the top left covered the card, mechanism: 16 + 140 + 8 px of gap
const TARGET_COLOR = '#c8302a'
// same damage flash as matchingQuestIsland.tsx; CARD_TOP: the
// sentence card's top, below the timer clock and the mute button;
// TARGET_COLOR: the target word's red (the matching quest's red area)

function EnSentence({ en, word }: { en: string, word: string }) {
    const i = word ? en.indexOf(word) : -1
    if (i < 0) return <>{en}</>
    return <>{en.slice(0, i)}<span style={{ color: TARGET_COLOR }}>{word}</span>{en.slice(i + word.length)}</>
}
// the card's English sentence with its first `word` in red ("I like <this>
// fish"); a word that isn't in the sentence leaves it all black

function Hud({ getHud, getSentence, run }: { run: boolean, getHud: () => TrainingHud, getSentence: () => { en: string, enWord: string, word: string } | undefined }) {
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
                <div style={{ fontSize: 20, fontWeight: 'bold' }}><EnSentence en={sentence.en} word={sentence.enWord} /></div> {/* text: **sentence.en** -> **EnSentence**, reason: the target word should stand out, mechanism: enWord in red, the rest black */} {/* text: **sentence.chars, spaced** -> **sentence.en**, mechanism: the English meaning; letterSpacing dropped, it was for the kana */}
                <div style={{ fontSize: 14, marginTop: 2 }}>your word: <b style={{ fontSize: 18 }}>{sentence.word}</b></div>
            </div>}
            {flash > 0 && <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: FLASH_COLOR, opacity: flash, pointerEvents: 'none' }} />}
            {run && <TimerClock frac={hud.timeFrac} />} {/* timer: **cyan strip while the timer runs** -> **TimerClock at the top left for the whole run**, reason: new timer art (timer-ui.png / timer-hand-ui.png), mechanism: timeFrac is 1 between words, so the hand rests at 12 */}
        </>
    )
}
// the matching quest's HUD: the timer clock goes round once over the 5 s timer, a wrong
// gap flashes red; under it a card with the sentence's English and the
// player's word

function Training({ w, h, onLeave, questions, sensitivity, tutorial, timerMs, children }: { w: number, h: number, onLeave: () => void, questions?: IbQuestion[], sensitivity?: number, tutorial?: TutorialProps, timerMs?: number, children?: ReactNode }) { // props: **+ timerMs?**, reason: shorter timers for harder quests, mechanism: passed to the training hook; left out = the quest's default timer // props: **+ tutorial?**, mechanism: passed on to useTutorial; undefined = no account, so Hiroko asks every time
    const t = useInBetweenTraining({ w, h, onLeave, questions, timerMs })
    const tut = useTutorial('inbetween', t.phase === 'intro', tutorial)
    const talk = useMergedTalk(t.talkRequest, tut.talkRequest)
    const zoomRequest = useQuestZoom(t.phase === 'play')
    // zoom out to QUEST_ZOOM (0.55) when a run starts
    const c = center(w, h)
    const npcs = inBetweenNpcs(w, h, t.phase)
    const cast = t.phase === 'intro' ? [...npcs, tut.hiroko((npcs[0].ent.x ?? 0) + HIROKO_DX, npcs[0].ent.y ?? 0)] : npcs
    // Hiroko as in matchingQuestIsland.tsx: index 1 right of Ryuuko, 'intro' only
    return (
        <>
            <GameScene bgProps={{ ...questBg(w, h), y: c.y + PLAYER_GAP }} npcs={cast} onChoice={(n, c) => tut.onChoice(n, c) || t.onChoice(n, c)} onTalkEnd={n => tut.onTalkEnd(n) || t.onTalkEnd(n)} onTick={t.onTick} renderWorld={t.renderWorld} talkRequest={talk} moveRequest={t.moveRequest} playerLabel={t.playerLabel} sensitivity={sensitivity} zoomRequest={zoomRequest} fitWhole /> {/* props: **npcs, t.onChoice, t.onTalkEnd, t.talkRequest** -> **cast with Hiroko, tut handlers first, merged talk**, mechanism: same as dodgeQuestIsland.tsx */}
            <Hud getHud={t.getHud} getSentence={t.getSentence} run={t.phase === 'play'} />
            {(t.phase === 'success' || t.phase === 'again') && children}
        </>
    )
}
// matchingQuestIsland.tsx's Training on useInBetweenTraining; fitWhole lets
// the player pinch out to read the whole sentence row

export function InBetweenQuestIsland({ onLeave, questions, sensitivity, tutorial, timerMs, children }: { onLeave: () => void, questions?: IbQuestion[], sensitivity?: number, tutorial?: TutorialProps, timerMs?: number, children?: ReactNode }) { // props: **+ timerMs?**, reason: shorter timers for harder quests, mechanism: passed to the training hook; left out = the quest's default timer // props: **+ tutorial?**, mechanism: passed through Training to useTutorial
    const boxRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ w: number, h: number }>()
    useEffect(() => { stopBgm() }, [])
    useEffect(() => {
        const h = Math.round(boxRef.current?.clientHeight || window.innerHeight)
        setSize({ w: h, h })
    }, [])
    return (
        <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', background: BUBBLE_BG }}>
            {size && <Training w={size.w} h={size.h} onLeave={onLeave} questions={questions} sensitivity={sensitivity} tutorial={tutorial} timerMs={timerMs}>{children}</Training>}
        </div>
    )
}
// same shell as MatchingQuestIsland; questions left out = IB_QUESTIONS (the
// issue's test sentence)
