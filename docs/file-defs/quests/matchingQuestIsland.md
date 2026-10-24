# matchingQuestIsland

- **Path:** `src/components/Game/Scene/matchingQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the matching quest: the dodge quest's square dojo, its damage flash and the timer clock (`timerClock.tsx`), on `useMatchingTraining`.

## Functions

### `MatchingQuestIsland`

Measures the box once, makes a square island one screen tall, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `group` | `KosoadoGroup?` | the quest's こそあど group (default `pronoun`) |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `timerMs` | `number?` | the pick timer in ms (default 10000); shorter = harder |
| `tutorial` | `TutorialProps?` | Hiroko's seen / onSeen (`useTutorial('matching')`); left out = she asks every time |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestMatching` (`?group=`) |
| quests | `src/components/Game/Scene/QuestScene.tsx` | `QuestScene` (quest_type `matching`) |
| mobile-testing | `src/components/Game/Scene/islandPreview.tsx` | `IslandPreview` (a saved quest with a `{ group }` target) |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useMatchingTraining`, `matchingNpcs` and Hiroko (`useTutorial`, index 1 right of Ryuuko in `intro`) into `GameScene`; `Hud` re-reads `getHud()` each frame for the timer clock (top left for the whole run, `run` = phase `play`) and the red flash on a wrong pick.

When a run starts (phase becomes `play`), `useQuestZoom` (training.ts) sends GameScene a `zoomRequest` for `QUEST_ZOOM` (0.55), so the run starts zoomed out; pinch / scroll still work.
