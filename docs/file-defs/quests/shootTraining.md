# shootTraining

- **Path:** `src/components/Game/Scene/shootTraining.ts`
- **Topic:** quests
- **Purpose:** Game logic of the shooting quest (copied from `../ikko`): catch the target kana for bullets, shoot Ryuuko as she walks until her hp runs out.

## Functions

### `useShootTraining`

Hook that runs the quest's phases (`TrainingPhase`, the same flow as `useTraining`). Catching the target gives a bullet (`AMMO_MAX` 5, a level starts with 0); catching a wrong block only flashes and plays the damage sound. Shooting a wrong block refunds a bullet. `maxHP` (5) hits on Ryuuko clear the level; the 60 s timer running out fails it. The player has no hp.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `w`, `h` | `number` | island size in world px |
| `onLeave` | `() => void` | called on はい to Elena |
| `kana` | `string?` | the target kana (default あ) |

**Output:** `{ phase, failedLevel, wallY, onTick, onChoice, onTalkEnd, renderWorld, getHud, playerLabel, talkRequest, moveRequest, onShoot, getRyuukoX }`, passed to `GameScene` like the other trainings.

- `onShoot()`: fires from the player's top edge. Returns false outside a level, so Space talks and taps walk; returns true with no ammo, so nothing fires but the input is still used.
- `playerLabel()`: ammo as `n/5`.
- `getRyuukoX()`: her walking x during a level, undefined otherwise.

**Side effects:** plays Ryuuko's kana clips and the damage sound; moves the player below Ryuuko at the start of a level.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/shootQuestIsland.tsx` | `Training` |

## Exports (data)

`RYUUKO_W`, `RYUUKO_H`: her 1.5x body size, used by the hitbox here and by `Training` to draw her.
