# shootQuestIsland

- **Path:** `src/components/Game/Scene/shootQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the shooting quest (copied from `../ikko`): a dojo 2x the screen wide (1x on a screen 768 px or wider, the web) and 1.5x tall, with the timer clock, Ryuuko's hp bar and the damage flash, on `useShootTraining`.

## Functions

### `ShootQuestIsland`

Measures the box once, sizes the island, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `kana` | `string?` | the target kana (default あ) |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `tutorial` | `TutorialProps?` | Hiroko's seen / onSeen (`useTutorial('shoot')`); left out = she asks every time |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestShoot` |
| quests | `src/components/Game/Scene/QuestScene.tsx` | `Island` when `questType` is `shoot` |
| mobile-testing | `src/components/Game/Scene/islandPreview.tsx` | saved-island quest with `quest_type` `shoot` |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useShootTraining`, `questIslandNpcs` and Hiroko (`useTutorial`, index 1 right of Ryuuko in `intro`) into `GameScene`, including `wallY` and `onShoot`. Ryuuko's ent is a 1.5x copy whose `x` is a getter on `getRyuukoX()`, so she walks without re-rendering `Training`.

`Hud` re-reads `getHud()` each frame for the timer clock (top left for the whole level), the ammo stack (`public/img/bullet.png`, 72 x 32 px, one per bullet held, going down from under the clock; the player's name tag no longer shows `n/5`), Ryuuko's hp as `Hearts` (one `public/img/heart2.png` per hp point, 3x, centered above the safe-area bottom; lost ones at 0.25 opacity) and the damage flash (unused now: no wrong-catch penalty).

Same as the dodge quest: `tintEdges={BUBBLE_BG}` for the status bar (issue #13), `useQuestZoom` for the 0.55 start zoom, clear / fail music commented out.
