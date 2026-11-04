# leftRightQuestIsland

- **Path:** `src/components/Game/Scene/leftRightQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the Left or Right (door) quest, copied from `../ikko`: the hallway room ([scene](../../scenes/hallway.md)), the word sign at the top, the hp bar and the damage / door fades, on `useLeftRightTraining`.

## Functions

### `LeftRightQuestIsland`

Sizes the island to the hall (`HALL_W` x `hallH()`), fills the box with `DOJO_WALL`, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `tutorial` | `TutorialProps?` | Hiroko's seen / onSeen (`useTutorial('door')`); left out = she asks every time |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestDoor` |
| quests | `src/components/Game/Scene/QuestScene.tsx` | `Island` when `questType` is `door` |
| mobile-testing | `src/components/Game/Scene/islandPreview.tsx` | saved-island quest with `quest_type` `door` |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useLeftRightTraining`, `leftRightNpcs` and Hiroko (index 1 right of Ryuuko in `intro`) into `GameScene` with `hallBg`, `feetH={FEET_H}` and `tintEdges={DOJO_WALL}`. `Hud` re-reads `getHud()` / `getFade()` / `getSign()` each frame: the damage flash, the black door fade, the word sign (below `--safe-top`) and the hp bar (above `--safe-bottom`). No timer and no start zoom: the hall already fits the screen.
