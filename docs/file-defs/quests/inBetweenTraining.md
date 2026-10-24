# inBetweenTraining

- **Path:** `src/components/Game/Scene/inBetweenTraining.ts`
- **Topic:** quests
- **Purpose:** Game logic of the in-between quest (issue #12): a sentence with one word missing lies on the dojo floor as character tiles with equal gaps, the player carries the missing word, and after a 5 s timer their feet must be in the gap where it fits.

## Functions

### `useInBetweenTraining`

Hook that runs the quest's phases (`intro` → `play` → `success` → `again`) and the per-sentence steps (`ask` 800 ms → `pick` 5 s → `result`). Built on `useMatchingTraining`.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `w`, `h` | `number` | island size in world px (square, one screen tall) |
| `onLeave` | `() => void` | called on はい to Elena |
| `questions` | `IbQuestion[]?` | the run's sentences (default `IB_QUESTIONS`) |
| `timerMs` | `number?` | the pick timer in ms (default `TIMER_MS` 5000); shorter = harder |

**Output:** `{ phase, onTick, onChoice, onTalkEnd, renderWorld, getHud, getSentence, playerLabel, talkRequest, moveRequest }`, passed to `GameScene` like the other trainings. `getSentence()` gives `{ en, enWord, word }` while playing (the shell's top card: the English sentence); `playerLabel()` is the word.

**Side effects:** plays Ryuuko's `mt-correct` / `mt-wrong` clips and the damage sound; moves the player below Ryuuko (above the row) before each sentence.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/inBetweenQuestIsland.tsx` | `Training` |

### `rowLayout`

The row centered under Ryuuko: `n` character tiles and the `n + 1` gaps around them (slot i is left of tile i), as top-left world-px boxes. A slot is its gap stretched to 64 px tall, the area the player's feet must be in.

**Input:** `w`, `h`, `n` (`number`). **Output:** `{ tiles, slots }` (`{ x, y, w, h }[]`).

**Used in:** `useInBetweenTraining` (`onTick` hit test, `renderWorld`).

## Exports (data)

- `IbQuestion`: `{ before, word, after, romaji, en, enWord }` (`enWord`: the part of `en` for `word`, red on the card); the floor shows `before + after`, the answer is slot `before.length`.
- `IB_QUESTIONS`: the test sentence 私は＿さかながすき / この.
- `IbPhase`: the phase union; `npcs.ts` `inBetweenNpcs` reads it.
- `PLAYER_GAP`: px from Ryuuko to the player's start; the shell's spawn.
