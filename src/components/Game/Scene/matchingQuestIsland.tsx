'use client'

import { ReactNode, useEffect, useReducer, useRef, useState } from "react"
import TimerClock from "./timerClock"
import GameScene, { questBg } from "./gameScene"
import { TrainingHud, useQuestZoom } from "./training"
import { center } from "./dodgeTraining"
import { PLAYER_GAP, useMatchingTraining } from "./matchingTraining"
import { matchingNpcs } from "../npcs/npcs"
import { BUBBLE_BG } from "../Entity/dialogBubble"
import { stopBgm } from "../Entity/voice"
import type { KosoadoGroup } from "../kosoado"
import { HIROKO_DX, useMergedTalk, useTutorial, type TutorialProps } from "./tutorial" // imports: **+ tutorial**, mechanism: Hiroko's matching tutorial, as in dodgeQuestIsland.tsx
// a copy of dodgeQuestIsland.tsx for the matching quest (issue #8): the same
// square dojo with Ryuuko at its center, the three areas and her word bubble
// from useMatchingTraining, Hiroko's tutorial in 'intro', and no hp bar

const FLASH_MS = 300
const FLASH_OPACITY = 0.6
const FLASH_COLOR = '#ff8a8a'
// same damage flash as dodgeQuestIsland.tsx

function Hud({ getHud, run }: { getHud: () => TrainingHud, run: boolean }) { // props: **+ run**, mechanism: the clock shows for the whole run, not only while the timer runs
    const [, force] = useReducer((n: number) => n + 1, 0)
    useEffect(() => {
        let raf = requestAnimationFrame(function loop() { force(); raf = requestAnimationFrame(loop) })
        return () => cancelAnimationFrame(raf)
    }, [])
    const hud = getHud()
    const flash = FLASH_OPACITY * Math.max(0, 1 - (performance.now() - hud.hurtAt) / FLASH_MS)
    return (
        <>
            {flash > 0 && <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: FLASH_COLOR, opacity: flash, pointerEvents: 'none' }} />}
            {run && <TimerClock frac={hud.timeFrac} />} {/* timer: **cyan strip while the timer runs** -> **TimerClock at the top left for the whole run**, reason: new timer art (timer-ui.png / timer-hand-ui.png), mechanism: timeFrac is 1 between words, so the hand rests at 12 */}
        </>
    )
}
// dodge's HUD without the hp bar: the timer clock (timerClock.tsx) at the top
// left for the whole run, its hand going round once over the pick timer, and
// a wrong pick flashes red

function Training({ w, h, onLeave, group, sensitivity, tutorial, timerMs, children }: { w: number, h: number, onLeave: () => void, group?: KosoadoGroup, sensitivity?: number, tutorial?: TutorialProps, timerMs?: number, children?: ReactNode }) { // props: **+ timerMs?**, reason: shorter timers for harder quests, mechanism: passed to the training hook; left out = the quest's default timer // props: **+ tutorial?**, mechanism: passed on to useTutorial; undefined = no account, so Hiroko asks every time // props: **+ group**, mechanism: passed to useMatchingTraining
    const t = useMatchingTraining({ w, h, onLeave, group, timerMs })
    const tut = useTutorial('matching', t.phase === 'intro', tutorial)
    const talk = useMergedTalk(t.talkRequest, tut.talkRequest)
    const zoomRequest = useQuestZoom(t.phase === 'play')
    // zoom out to QUEST_ZOOM (0.55) when a run starts
    const c = center(w, h)
    const npcs = matchingNpcs(w, h, t.phase)
    const cast = t.phase === 'intro' ? [...npcs, tut.hiroko((npcs[0].ent.x ?? 0) + HIROKO_DX, npcs[0].ent.y ?? 0)] : npcs
    // dodgeQuestIsland.tsx's Hiroko: live only in 'intro', appended as index 1
    // (HIROKO) right of Ryuuko; Elena is never out in 'intro'. talk is the one
    // talkRequest GameScene gets (the training's or Hiroko's, whichever changed last)
    return (
        <>
            <GameScene bgProps={{ ...questBg(w, h), y: c.y + PLAYER_GAP }} npcs={cast} onChoice={(n, c) => tut.onChoice(n, c) || t.onChoice(n, c)} onTalkEnd={n => tut.onTalkEnd(n) || t.onTalkEnd(n)} onTick={t.onTick} renderWorld={t.renderWorld} talkRequest={talk} moveRequest={t.moveRequest} playerLabel={t.playerLabel} sensitivity={sensitivity} zoomRequest={zoomRequest} /> {/* props: **npcs, t.onChoice, t.onTalkEnd, t.talkRequest** -> **cast with Hiroko, tut handlers first, merged talk**, mechanism: same as dodgeQuestIsland.tsx */}
            <Hud getHud={t.getHud} run={t.phase === 'play'} />
            {(t.phase === 'success' || t.phase === 'again') && children}
        </>
    )
}
// dodgeQuestIsland.tsx's Training on useMatchingTraining: questBg's dojo,
// the player spawning PLAYER_GAP below Ryuuko, children in the success slot

export function MatchingQuestIsland({ onLeave, group, sensitivity, tutorial, timerMs, children }: { onLeave: () => void, group?: KosoadoGroup, sensitivity?: number, tutorial?: TutorialProps, timerMs?: number, children?: ReactNode }) { // props: **+ timerMs?**, reason: shorter timers for harder quests, mechanism: passed to the training hook; left out = the quest's default timer // props: **+ tutorial?**, mechanism: passed through Training to useTutorial // props: **+ group**, mechanism: the quest's こそあど group (its target); left out = これ / それ / あれ / どれ
    const boxRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ w: number, h: number }>()
    useEffect(() => { stopBgm() }, [])
    useEffect(() => {
        const h = Math.round(boxRef.current?.clientHeight || window.innerHeight)
        setSize({ w: h, h })
    }, [])
    return (
        <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', background: BUBBLE_BG }}>
            {size && <Training w={size.w} h={size.h} onLeave={onLeave} group={group} sensitivity={sensitivity} tutorial={tutorial} timerMs={timerMs}>{children}</Training>}
        </div>
    )
}
// same shell as DodgeQuestIsland: stops any island BGM, measures the box
// once after mount, square island one screen tall
