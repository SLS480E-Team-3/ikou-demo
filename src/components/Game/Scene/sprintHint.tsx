'use client'

import KeyHintButton from "../Entity/keyHintButton"

const HINT_SCALE = 3 // KeyHintButton is sized in world px; the scene draws those x3 while talking, so x3 here matches the talk hints
const HINT_RIGHT = 12 // css px from the screen's right edge (inside the safe area)
const HINT_BOTTOM = 80 // css px from the bottom: above the quests' hp bar / hearts (40 + 24 px tall)

export default function SprintHint() {
    return (
        <KeyHintButton
            keys={['Shift']}
            label="hold: max speed"
            style={{
                position: 'absolute',
                zIndex: 2,
                right: `calc(var(--safe-right) + ${HINT_RIGHT}px)`,
                bottom: `calc(var(--safe-bottom) + ${HINT_BOTTOM}px)`,
                transform: `scale(${HINT_SCALE})`,
                transformOrigin: 'bottom right',
            }}
        />
    )
}
// the Shift sprint hint for quests the player walks with WASD (dodge, shoot,
// matching, in-between, door): GameScene moves at PLAYER_SPEED x SPRINT
// while Shift is held, and testers didn't know. Screen px HUD, not world px,
// so it stays put while the camera moves; scale() keeps the keycap's 1px
// borders crisp multiples instead of re-sizing the CSS. Bottom right, inside
// the safe area (docs/home-screen-app.md), clear of the top-left clock, the
// top-right mute button and the bottom hp bar. KeyHintButton hides itself on
// touch devices, where the stick pushed to its edge sprints instead.
// Not used in the bridge quest: there the player walks a drawn path
