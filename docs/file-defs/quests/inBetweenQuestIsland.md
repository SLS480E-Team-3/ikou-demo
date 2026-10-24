# inBetweenQuestIsland

- **Path:** `src/components/Game/Scene/inBetweenQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the in-between quest (issue #12): the matching quest's square dojo, timer strip and damage flash, plus a top card with the sentence's English (target word in red, `EnSentence`) and the player's word, on `useInBetweenTraining`.

## Functions

### `InBetweenQuestIsland`

Measures the box once, makes a square island one screen tall, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `questions` | `IbQuestion[]?` | the run's sentences (default `IB_QUESTIONS`) |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `timerMs` | `number?` | the pick timer in ms (default 5000); shorter = harder |
| `tutorial` | `TutorialProps?` | Hiroko's seen / onSeen (`useTutorial('inbetween')`); left out = she asks every time |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestInBetween` |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useInBetweenTraining`, `inBetweenNpcs` and Hiroko (`useTutorial`, index 1 right of Ryuuko in `intro`) into `GameScene` (with `fitWhole`, so the player can pinch out to the whole row); `Hud` re-reads `getHud()` / `getSentence()` each frame for the cyan 5 s timer strip, the sentence card (below the mute button) and the red flash on a wrong gap.

When a run starts (phase becomes `play`), `useQuestZoom` (training.ts) sends GameScene a `zoomRequest` for `QUEST_ZOOM` (0.55), so the run starts zoomed out; pinch / scroll still work.
