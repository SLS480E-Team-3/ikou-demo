# bridgeTraining

- **Path:** `src/components/Game/Scene/bridgeTraining.ts`
- **Topic:** quests
- **Purpose:** Game logic of the bridge quest: Ryuuko says a こそあど word, the player draws a line over a strip of spikes to one of three meaning areas and walks it; a wrong bridge breaks mid-gap and blacks out.

## Functions

### `useBridgeTraining`

Hook that runs the quest's phases (`intro` → `play` → `success` → `again`) and the per-word steps (`ask` 800 ms → `draw` `timerMs` → `walk` → `result`, or `fall` on a wrong bridge / time out).

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `w`, `h` | `number` | island size in world px (square, one screen tall) |
| `onLeave` | `() => void` | called on はい to Elena |
| `group` | `KosoadoGroup?` | which four words the run asks (default `pronoun`); words and meanings from `questionsFor` (matchingTraining.ts) |
| `timerMs` | `number?` | the drawing timer in ms (default 10000) |

**Output:** `{ phase, onTick, onChoice, onTalkEnd, onArrive, renderWorld, getHud, cameraFocus, playerLabel, talkRequest, moveRequest, walkPath, strokeStart, strokeMove, strokeEnd }`. `walkPath` / `onArrive` go to GameScene's tap mode; `strokeStart(x, y)` / `strokeMove(x, y)` / `strokeEnd()` take screen px from the shell's drawing layer. `getHud().playing` is true only while drawing; `getHud().blackAt` is when the last blackout began. `cameraFocus()` gives the camera point during `ask` / `draw` (halfway between the areas' top and the player's feet, so both fit on a phone), else `undefined` (follow the player).

**Side effects:** plays Ryuuko's `mt-correct` / `mt-wrong` clips and the damage sound; moves the player to the start before each word and after a fall.

**Rules**
- A stroke that doesn't end inside an area is wiped; the player may draw again while the timer lasts.
- The bridge is `[player's feet, ...stroke]`. Right area: walked to the end. Wrong area: walked to where it first crosses the middle of the spikes (interpolated), then the player drops `DROP_PX`, the screen blacks out, and once they land they go back to the start; the same word comes back after `BLACK_MS`.
- Time out while drawing = wrong (blackout, no walk).
- After the last word the player is moved back to the start (the spikes are solid outside the run), then `success`.
- Screen → world px: an invisible div in `renderWorld` covers the world, and its `getBoundingClientRect` carries the camera's offset and zoom.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/bridgeQuestIsland.tsx` | `Training` |

### `bridgeLayout`

The quest's places in world px: `areas` (3 boxes, centered over the player's start, `AREA_TOP` above the center), `gap` (the spike strip, wall to wall, 4 rows of 44 px), `ryuuko` and `start` (centers, bottom left of the dojo).

**Input:** `w`, `h` (`number`). **Output:** `{ areas, gap, ryuuko, start }`.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/bridgeTraining.ts` | `useBridgeTraining` |
| quests | `src/components/Game/Scene/bridgeQuestIsland.tsx` | `Training` (spawn) |
| npcs | `src/components/Game/npcs/npcs.ts` | `bridgeNpcs` |

### `spikeSection`

The spike strip as a solid `BgSection` (`bridgeLayout(w, h).gap`, pit color). Added to `questBg`'s sections, so the player can't walk into the spikes in `intro` / `success` / `again`; a `WalkPath` ignores solids, so the bridge still crosses.

**Input:** `w`, `h` (`number`). **Output:** `BgSection`.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/bridgeQuestIsland.tsx` | `Training` (`bgProps.sections`) |

## Exports (data)

- `BrPhase`: the phase union; `npcs.ts` `bridgeNpcs` reads it.
- `RYUUKO_SPOT`, `PLAYER_SPOT`: offsets from the dojo's center.
- `BLACK_IN_MS`, `BLACK_MS`: the blackout's fade-in and length, shared with the shell.
