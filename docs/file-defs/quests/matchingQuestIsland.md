# matchingQuestIsland

- **Path:** `src/components/Game/Scene/matchingQuestIsland.tsx`
- **Topic:** quests
- **Purpose:** Screen shell of the matching quest: the dodge quest's square dojo, its timer strip and damage flash, on `useMatchingTraining`.

## Functions

### `MatchingQuestIsland`

Measures the box once, makes a square island one screen tall, stops any BGM and renders the training.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `onLeave` | `() => void` | Elena's はい |
| `sensitivity` | `number?` | stick sensitivity, passed to GameScene |
| `children` | `ReactNode?` | success slot (shown in `success` / `again`) |

**Output:** JSX. **Side effects:** `stopBgm()` on mount.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.QuestMatching` |

### `Training`, `Hud`, `Bar` (local)

`Training` wires `useMatchingTraining` and `matchingNpcs` into `GameScene`; `Hud` re-reads `getHud()` each frame for the cyan 3 s timer strip and the red flash on a wrong pick.
