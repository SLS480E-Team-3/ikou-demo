# inBetweenQuestIsland

- **Path:** `src/components/Game/Scene/inBetweenQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the in-between quest (issue #12): the matching quest's square dojo, timer strip and damage flash, plus a top card with the whole sentence and the player's word, on `useInBetweenTraining`.

## Functions

### `InBetweenQuestIsland`

Measures the box once, makes a square island one screen tall, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `questions` | `IbQuestion[]?` | the run's sentences (default `IB_QUESTIONS`) |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestInBetween` |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useInBetweenTraining` and `inBetweenNpcs` into `GameScene` (with `fitWhole`, so the player can pinch out to the whole row); `Hud` re-reads `getHud()` / `getSentence()` each frame for the cyan 5 s timer strip, the sentence card (below the mute button) and the red flash on a wrong gap.
