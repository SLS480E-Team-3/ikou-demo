'use client'

import { ReactNode, useEffect, useReducer, useRef, useState } from "react"
import TimerClock, { CLOCK_LEFT, CLOCK_SIZE, CLOCK_TOP } from "./timerClock" // imports: **+ CLOCK_LEFT, CLOCK_SIZE, CLOCK_TOP**, mechanism: the bullet stack hangs under the clock
import GameScene, { questBg } from "./gameScene"
import { TrainingHud, useQuestZoom } from "./training"
import { AMMO_MAX, RYUUKO_W, RYUUKO_H, useShootTraining } from "./shootTraining" // imports: **useShootTraining** -> **+ RYUUKO_W, RYUUKO_H**, mechanism: her 1.5x size
import { questIslandNpcs } from "../npcs/npcs"
import { BUBBLE_BG } from "../Entity/dialogBubble" // imports: **BUBBLE_BG, BUBBLE_BOARDER, BUBBLE_BORDER_W** -> **BUBBLE_BG**, mechanism: they styled the hp Bar, which is hearts now
import { stopBgm /* , QUEST_BGM, playBgm */ } from "../Entity/voice"
import { HIROKO_DX, useMergedTalk, useTutorial, type TutorialProps } from "./tutorial"
// Hiroko's quest tutorial (tutorial.ts): her NPC, her choice / talk-end
// handlers and her talk request for this quest type
// copied from ../ikko's shootQuestIsland.tsx: runs useShootTraining and hands
// its onShoot to GameScene. The HUD, zoom and status-bar tint follow
// dodgeQuestIsland.tsx

const HP_BOTTOM = 40
const HEART_IMG = '/img/heart2.png'
const HEART_SCALE = 3
const HEART_W = 14 * HEART_SCALE
const HEART_H = 12 * HEART_SCALE
const HEART_GAP = 6
const HEART_LOST = 0.25
// hp: **bar** -> **hearts**, reason: Ryuuko's hp as heart2.png (14 x 12 px
// art) drawn HEART_SCALE x, HEART_GAP px apart, HP_BOTTOM px above the
// safe-area bottom; a lost heart stays at HEART_LOST opacity
const HP_COLOR = '#ff8a8a'
const FLASH_MS = 300
const FLASH_OPACITY = 0.6
const WIDE_MIN_W = 768
// css px from which a screen counts as web (laptop / desktop), the same line
// tutorial.ts uses for Hiroko's keys lines
const BULLET_IMG = '/img/bullet.png'
const AMMO_W = 72
const AMMO_H = 32
const AMMO_STEP = 36
const AMMO_GAP = 8
// the ammo stack: public/img/bullet.png (145 x 64 px art) drawn AMMO_W x
// AMMO_H css px, one per bullet held, AMMO_STEP px apart going down, starting
// AMMO_GAP px under the timer clock
// same HUD sizes / colors / damage flash as dodgeQuestIsland.tsx (copied, since
// that file doesn't export them)

function Hearts({ hp, maxHP }: { hp: number, maxHP: number }) {
    return (
        <div style={{ position: 'absolute', zIndex: 2, bottom: `calc(var(--safe-bottom) + ${HP_BOTTOM}px)`, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: HEART_GAP, pointerEvents: 'none' }}>
            {Array.from({ length: maxHP }, (_, i) => <img key={i} src={HEART_IMG} alt="" draggable={false} style={{ width: HEART_W, height: HEART_H, imageRendering: 'pixelated', opacity: i < hp ? 1 : HEART_LOST }} />)}
        </div>
    )
}
// one heart per maxHP, centered in a row; the first hp are full, the rest
// faded, so a hit on Ryuuko dims the rightmost full heart

function Hud({ getHud, getAmmo, run }: { getHud: () => TrainingHud, getAmmo: () => number, run: boolean }) {
    const [, force] = useReducer((n: number) => n + 1, 0)
    useEffect(() => {
        let raf = requestAnimationFrame(function loop() { force(); raf = requestAnimationFrame(loop) })
        return () => cancelAnimationFrame(raf)
    }, [])
    const hud = getHud()
    const flash = FLASH_OPACITY * Math.max(0, 1 - (performance.now() - hud.hurtAt) / FLASH_MS)
    const overlay = flash > 0 && <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: HP_COLOR, opacity: flash, pointerEvents: 'none' }} />
    return (
        <>
            {overlay}
            {run && <TimerClock frac={hud.timeFrac} />}
            {run && Array.from({ length: Math.min(AMMO_MAX, getAmmo()) }, (_, i) => <img key={i} src={BULLET_IMG} alt="" draggable={false} style={{ position: 'absolute', zIndex: 2, left: `calc(var(--safe-left) + ${CLOCK_LEFT + (CLOCK_SIZE - AMMO_W) / 2}px)`, top: `calc(var(--safe-top) + ${CLOCK_TOP + CLOCK_SIZE + AMMO_GAP + i * AMMO_STEP}px)`, width: AMMO_W, height: AMMO_H, imageRendering: 'pixelated', pointerEvents: 'none' }} />)}
            {/* ammo: **n/5 on the player's name tag** -> **bullet.png stacked under the clock**, reason: show the bullets held as pictures, mechanism: getAmmo() each frame (this rAF), one img per bullet, centered under the clock and stacking downward */}
            {hud.playing && <Hearts hp={hud.hp} maxHP={hud.maxHP} />} {/* hp: **Bar (hp / maxHP)** -> **Hearts**, mechanism: heart2.png per hp point, see Hearts */}
        </>
    )
}
// dodgeQuestIsland.tsx's HUD: its own rAF re-reads getHud() each frame for the
// damage flash, the timer clock (top left, the whole level), the bullet stack
// under it and the hp bar, which is Ryuuko's hp in this quest

function Training({ w, h, onLeave, kana, sensitivity, tutorial, children }: { w: number, h: number, onLeave: () => void, kana?: string, sensitivity?: number, tutorial?: TutorialProps, children?: ReactNode }) {
    const t = useShootTraining({ w, h, onLeave, kana })
    const tut = useTutorial('shoot', t.phase === 'intro', tutorial)
    const talk = useMergedTalk(t.talkRequest, tut.talkRequest)
    const zoomRequest = useQuestZoom(t.phase === 'play1' || t.phase === 'play2')
    // zoom out to QUEST_ZOOM (0.55) when a run starts
    // Hiroko's tutorial is live only in 'intro'; talk is the one talkRequest
    // GameScene gets (the training's or Hiroko's, whichever changed last).
    // Both hooks run at the top level, never inside the JSX
    const npcs = questIslandNpcs(w, h, t.phase, t.getHud().target, t.failedLevel).map((n, i) => {
        if (i !== 0) return n
        const x = n.ent.x
        return { ...n, ent: { ...n.ent, w: RYUUKO_W, h: RYUUKO_H, get x() { return t.getRyuukoX() ?? x } } }
    })
    // Ryuuko (index 0) is a shallow copy at 1.5x, so npcs.ts keeps the default
    // size. GameScene force()-renders every frame and reads ent.x each time
    // (drawing, solids, camera), so the getter hands it her walking x without
    // re-rendering Training; outside a level it falls back to npcs.ts's x
    const cast = t.phase === 'intro' ? [...npcs, tut.hiroko((npcs[0].ent.x ?? 0) + HIROKO_DX, npcs[0].ent.y ?? 0)] : npcs
    // intro only: Hiroko appended as index 1 (HIROKO), HIROKO_DX px right of
    // the resized Ryuuko; Elena is never out in 'intro'
    // const bgm = t.phase === 'success' || t.phase === 'again' ? QUEST_BGM.clear : t.phase === 'fail' ? QUEST_BGM.fail : undefined
    // useEffect(() => bgm ? playBgm(bgm) : undefined, [bgm]) // music: off like dodgeQuestIsland.tsx; uncomment to bring it back
    return (
        <>
            <GameScene tintEdges={BUBBLE_BG} bgProps={questBg(w, h)} npcs={cast} onChoice={(n, c) => tut.onChoice(n, c) || t.onChoice(n, c)} onTalkEnd={n => tut.onTalkEnd(n) || t.onTalkEnd(n)} onTick={t.onTick} renderWorld={t.renderWorld} talkRequest={talk} moveRequest={t.moveRequest} wallY={t.wallY} sensitivity={sensitivity} /* playerLabel: **t.playerLabel (ammo n/5)** -> **none**, mechanism: the ammo is the bullet stack under the clock now, so the tag shows the player's name */ onShoot={t.onShoot} zoomRequest={zoomRequest} />
            <Hud getHud={t.getHud} getAmmo={t.getAmmo} run={t.phase === 'play1' || t.phase === 'play2'} />
            {(t.phase === 'success' || t.phase === 'again') && children}
        </>
    )
}
// dodgeQuestIsland.tsx's Training on useShootTraining, plus wallY and onShoot:
// GameScene calls onShoot on Space, a quick tap, or a second finger while the
// stick is held; it fires only during a level and returns false otherwise, so
// Space still talks outside one. tut handlers run first and return true when
// the event was Hiroko's, so || skips the training's

export function ShootQuestIsland({ onLeave, kana, sensitivity, tutorial, children }: { onLeave: () => void, kana?: string, sensitivity?: number, tutorial?: TutorialProps, children?: ReactNode }) {
    const boxRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ w: number, h: number }>()
    useEffect(() => { stopBgm() }, [])
    useEffect(() => {
        const box = boxRef.current
        const w = box?.clientWidth || window.innerWidth
        const h = box?.clientHeight || window.innerHeight
        setSize({ w: Math.round(w * (w < WIDE_MIN_W ? 2 : 1)), h: Math.round(h * 1.5) }) // width: **2x the screen** -> **1x on a wide (web) screen**, reason: on a laptop the dojo was far too wide, mechanism: phones (under WIDE_MIN_W) keep 2x, wider screens get half that
    }, [])
    return (
        <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', background: BUBBLE_BG }}>
            {size && <Training w={size.w} h={size.h} onLeave={onLeave} kana={kana} sensitivity={sensitivity} tutorial={tutorial}>{children}</Training>}
        </div>
    )
}
// same shell as DodgeQuestIsland (stops any island BGM, measures the box once
// after mount), but the island is 2x wide (1x on web) / 1.5x tall as in ikko, so
// Ryuuko has room to walk and blocks have room above the wall
