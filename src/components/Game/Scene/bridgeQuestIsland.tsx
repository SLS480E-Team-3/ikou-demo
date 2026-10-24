'use client'

import { PointerEvent, ReactNode, useEffect, useReducer, useRef, useState } from "react"
import { useQuestZoom } from "./training"
import TimerClock from "./timerClock"
import GameScene, { questBg } from "./gameScene"
import { BLACK_IN_MS, BLACK_MS, useBridgeTraining, bridgeLayout, spikeSection } from "./bridgeTraining"
import { bridgeNpcs } from "../npcs/npcs"
import { BUBBLE_BG } from "../Entity/dialogBubble"
import { stopBgm } from "../Entity/voice"
import type { KosoadoGroup } from "../kosoado"
import { HIROKO_DX, useMergedTalk, useTutorial, type TutorialProps } from "./tutorial"
// the bridge quest's screen: matchingQuestIsland.tsx's square dojo and timer
// clock on useBridgeTraining, a drawing layer over the scene while the timer
// runs, and a blackout in place of the red flash

const BLACK_OUT_MS = 400
// the blackout fades in over
// BLACK_IN_MS, holds, and fades out over the last BLACK_OUT_MS of BLACK_MS
// (bridgeTraining.ts moves the player back while it is fully black)

const noTap = () => {}
// GameScene's tap mode during the run: the stick and keys never move the
// player, who only walks the bridge's WalkPath

type Stroke = { start: (x: number, y: number) => void, move: (x: number, y: number) => void, end: () => void }

function Hud({ getHud, stroke, run }: { getHud: ReturnType<typeof useBridgeTraining>['getHud'], stroke: Stroke, run: boolean }) { // props: **+ run**, mechanism: the clock shows for the whole run
    const [, force] = useReducer((n: number) => n + 1, 0)
    const finger = useRef<number | null>(null)
    useEffect(() => {
        let raf = requestAnimationFrame(function loop() { force(); raf = requestAnimationFrame(loop) })
        return () => cancelAnimationFrame(raf)
    }, [])
    const hud = getHud()
    const t = performance.now() - hud.blackAt
    const black = t < 0 || t > BLACK_MS ? 0 : Math.min(1, t / BLACK_IN_MS, (BLACK_MS - t) / BLACK_OUT_MS)
    const down = (e: PointerEvent<HTMLDivElement>) => {
        if (finger.current !== null) return
        finger.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        stroke.start(e.clientX, e.clientY)
    }
    const move = (e: PointerEvent<HTMLDivElement>) => { if (e.pointerId === finger.current) stroke.move(e.clientX, e.clientY) }
    const up = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerId !== finger.current) return
        finger.current = null
        stroke.end()
    }
    return (
        <>
            {hud.playing && <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ position: 'absolute', inset: 0, zIndex: 2, touchAction: 'none', cursor: 'crosshair' }} />}
            {black > 0 && <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'black', opacity: black, pointerEvents: 'none' }} />}
            {run && <TimerClock frac={hud.timeFrac} />} {/* timer: **cyan strip while the timer runs** -> **TimerClock at the top left for the whole run**, reason: new timer art (timer-ui.png / timer-hand-ui.png), mechanism: timeFrac is 1 between words, so the hand rests at 12 */}
        </>
    )
}
// the drawing layer is up only while the timer runs (hud.playing): one
// finger (or the mouse) draws, captured so the line keeps going past the
// layer's edge; it covers GameScene so a drag draws instead of panning. The
// blackout covers everything, the timer clock sits over the drawing layer

function Training({ w, h, onLeave, group, sensitivity, tutorial, timerMs, children }: { w: number, h: number, onLeave: () => void, group?: KosoadoGroup, sensitivity?: number, tutorial?: TutorialProps, timerMs?: number, children?: ReactNode }) {
    const t = useBridgeTraining({ w, h, onLeave, group, timerMs })
    const tut = useTutorial('bridge', t.phase === 'intro', tutorial)
    const talk = useMergedTalk(t.talkRequest, tut.talkRequest)
    const zoomRequest = useQuestZoom(t.phase === 'play')
    // zoom out to QUEST_ZOOM (0.55) when a run starts
    const start = bridgeLayout(w, h).start
    const bg = questBg(w, h)
    const npcs = bridgeNpcs(w, h, t.phase)
    const cast = t.phase === 'intro' ? [...npcs, tut.hiroko((npcs[0].ent.x ?? 0) - HIROKO_DX, npcs[0].ent.y ?? 0)] : npcs
    // Hiroko as in matchingQuestIsland.tsx (index 1, in 'intro' only), but left
    // of Ryuuko: the player starts at her right
    return (
        <>
            <GameScene bgProps={{ ...bg, x: start.x, y: start.y, sections: [...(bg.sections ?? []), spikeSection(w, h)] }} npcs={cast} onChoice={(n, c) => tut.onChoice(n, c) || t.onChoice(n, c)} onTalkEnd={n => tut.onTalkEnd(n) || t.onTalkEnd(n)} onTick={t.onTick} renderWorld={t.renderWorld} talkRequest={talk} moveRequest={t.moveRequest} playerLabel={t.playerLabel} sensitivity={sensitivity} zoomRequest={zoomRequest} onTap={t.phase === 'play' ? noTap : undefined} walkPath={t.walkPath} onArrive={t.onArrive} cameraFocus={t.cameraFocus} fitWhole />
            <Hud getHud={t.getHud} stroke={{ start: t.strokeStart, move: t.strokeMove, end: t.strokeEnd }} run={t.phase === 'play'} />
            {(t.phase === 'success' || t.phase === 'again') && children}
        </>
    )
}
// free roam in intro / success / again (walk up to Ryuuko, Hiroko, Elena),
// with the spikes a solid section so the player can't walk into them; tap
// mode in play. The player spawns at the bridge's start (bgProps x / y), and
// cameraFocus frames the areas and the player while drawing

export function BridgeQuestIsland({ onLeave, group, sensitivity, tutorial, timerMs, children }: { onLeave: () => void, group?: KosoadoGroup, sensitivity?: number, tutorial?: TutorialProps, timerMs?: number, children?: ReactNode }) {
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
// same shell as MatchingQuestIsland: stops any island BGM, measures the box
// once after mount, square island one screen tall
