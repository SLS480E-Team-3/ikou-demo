'use client'

// the quests' timer: a clock face (timer-ui.png) with one hand
// (timer-hand-ui.png) that starts at 12 o'clock and goes once round, back to
// 12, as the time runs out. Pixel art drawn SCALE x (140 px), at the top left

const FACE = '/img/timer-ui.png'
const HAND = '/img/timer-hand-ui.png'
const SCALE = 4 // SCALE: **2** -> **4**, reason: the clock was too small, mechanism: face and hand both drawn at 4x (140 px), pivot / center math is in art px so it follows
const FACE_PX = 35
const HAND_W = 16
const HAND_H = 13
const FACE_C = FACE_PX / 2
const PIVOT = { x: 2.5, y: 10.5 }
const HAND_DEG = -53.13
const LEFT = 16
const TOP = 16
// art px: the face's center, the hand's pivot (the middle of the square at
// its bottom left) and its rest angle (it points up right, atan(12 / 9) =
// 53.13 degrees clockwise from 12, so it is turned back by that much). LEFT /
// TOP: css px from the screen's top left (below the safe-area inset)

export default function TimerClock({ frac }: { frac: number }) {
    const deg = HAND_DEG + 360 * (1 - Math.min(1, Math.max(0, frac)))
    return (
        <div style={{ position: 'absolute', zIndex: 2, left: `calc(var(--safe-left) + ${LEFT}px)`, top: `calc(var(--safe-top) + ${TOP}px)`, width: FACE_PX * SCALE, height: FACE_PX * SCALE, pointerEvents: 'none' }}>
            <img src={FACE} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }} />
            <img src={HAND} alt="" draggable={false} style={{
                position: 'absolute', imageRendering: 'pixelated',
                width: HAND_W * SCALE, height: HAND_H * SCALE,
                left: (FACE_C - PIVOT.x) * SCALE, top: (FACE_C - PIVOT.y) * SCALE,
                transformOrigin: `${PIVOT.x * SCALE}px ${PIVOT.y * SCALE}px`,
                transform: `rotate(${deg}deg)`,
            }} />
        </div>
    )
}
// frac: the time left, 1 (full) to 0. 1 and 0 both put the hand at 12; in
// between it has gone (1 - frac) of a turn clockwise. The hand is placed so
// its pivot sits on the face's center and turns around that point
