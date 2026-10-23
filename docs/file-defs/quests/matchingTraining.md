# matchingTraining

- **Path:** `src/components/Game/Scene/matchingTraining.ts`
- **Topic:** quests
- **Purpose:** Game logic of the matching quest (issue #8): Ryuuko says a word, three colored areas appear, and after a 3 s timer the player must stand in the area with the right English meaning.

## Functions

### `useMatchingTraining`

Hook that runs the quest's phases (`intro` → `play` → `success` → `again`) and the per-word steps (`ask` 800 ms → `pick` 3 s → `result`).

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `w`, `h` | `number` | island size in world px (square, one screen tall) |
| `onLeave` | `() => void` | called on はい to Elena |

**Output:** `{ phase, onTick, onChoice, onTalkEnd, renderWorld, getHud, playerLabel, talkRequest, moveRequest }`, passed to `GameScene` like the other trainings. `getHud().playing` is true only while the pick timer runs.

**Side effects:** plays Ryuuko's `mt-correct` / `mt-wrong` clips and the damage sound; moves the player below Ryuuko before each word.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/matchingQuestIsland.tsx` | `Training` |

### `areaBoxes`

The three areas' boxes (top-left, world px), centered under Ryuuko: red, blue, green from left to right.

**Input:** `w`, `h` (`number`): island size. **Output:** `{ x, y, w, h }[]` (3).

**Used in:** `useMatchingTraining` (`onTick` hit test on the player's feet, `renderWorld`).

## Exports (data)

- `MT_QUESTIONS: MatchQuestion[]`: one run's words in order (`word`, `romaji`, `answer`, `decoys`). Prototype: これ (this / that / which).
- `MtPhase`: the phase union; `npcs.ts` `matchingNpcs` reads it.
- `PLAYER_GAP`: px from Ryuuko to the player's start; the shell's spawn.
