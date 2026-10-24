# bridgeQuestIsland

- **Path:** `src/components/Game/Scene/bridgeQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the bridge quest: the matching quest's square dojo and timer strip on `useBridgeTraining`, a drawing layer while the timer runs, and a blackout.

## Functions

### `BridgeQuestIsland`

Measures the box once, makes a square island one screen tall, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `group` | `KosoadoGroup?` | the こそあど group (default `pronoun`) |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `timerMs` | `number?` | the drawing timer in ms (default 10000) |
| `tutorial` | `TutorialProps?` | Hiroko's seen / onSeen (`useTutorial('bridge')`); left out = she asks every time |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestBridge` (`?group=`) |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useBridgeTraining`, `bridgeNpcs` and Hiroko (index 1, `HIROKO_DX` **left** of Ryuuko in `intro`, since the player starts at her right) into `GameScene` with `fitWhole`, `cameraFocus` and `spikeSection` appended to `questBg`'s sections; during `play` it passes `onTap` (a no-op), so GameScene's tap mode freezes the stick and only `walkPath` moves the player. `Hud` re-renders each frame: the drawing layer (one pointer, captured; covers the scene so a drag draws instead of panning) and the cyan strip while `getHud().playing`, and the black overlay from `getHud().blackAt` (fade in `BLACK_IN_MS`, hold, fade out the last 400 ms of `BLACK_MS`).

When a run starts (phase becomes `play`), `useQuestZoom` (training.ts) sends GameScene a `zoomRequest` for `QUEST_ZOOM` (0.55), so the run starts zoomed out; pinch / scroll still work.
