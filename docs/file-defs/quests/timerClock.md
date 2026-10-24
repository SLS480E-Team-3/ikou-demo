# timerClock

- **Path:** `src/components/Game/Scene/timerClock.tsx`
- **Topic:** quests
- **Purpose:** The quests' timer: a clock face (`public/img/timer-ui.png`, 35 px) with one hand (`timer-hand-ui.png`, 16 x 13) drawn 4x (140 px) at the screen's top left.

## Functions

### `TimerClock` (default export)

Draws the face and turns the hand around the face's center: at 12 o'clock when `frac` is 1, one full turn clockwise as it falls to 0, back at 12.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `frac` | `number` | time left, 1 (full) to 0; clamped |

**Output:** JSX (absolute, zIndex 2, `pointerEvents: none`, 16 px from the safe-area top left). **Side effects:** none.

The hand's art points 53.13 degrees clockwise from 12 (`HAND_DEG` turns it back) and pivots on the middle of its bottom-left square (`PIVOT`, art px 2.5, 10.5), which is placed on the face's center (17.5, 17.5).

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/dodgeQuestIsland.tsx` | `Hud` (phases `play1` / `play2`) |
| quests | `src/components/Game/Scene/matchingQuestIsland.tsx` | `Hud` (phase `play`) |
| quests | `src/components/Game/Scene/inBetweenQuestIsland.tsx` | `Hud` (phase `play`) |
| quests | `src/components/Game/Scene/bridgeQuestIsland.tsx` | `Hud` (phase `play`) |
