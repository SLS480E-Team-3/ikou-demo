# leftRightTraining

- **Path:** `src/components/Game/Scene/leftRightTraining.ts`
- **Topic:** quests
- **Purpose:** Game logic of the Left or Right (door) quest, copied from `../ikko` ([spec](../../left-or-right.spec.json)): a verb on the sign, walk into the door with its English meaning.

## Functions

### `useLeftRightTraining`

Hook that runs `LrPhase` (`intro` → `play` → `success` / `fail` → `again`). A run is `buildRun()`'s 10 questions; a wrong door costs one hp and Ryuuko says ちがうわよ！, a right one いいね！; each door fades the screen to black and puts the player back at the spawn.

**Input:** `w`, `h` (hall size in world px), `onLeave` (Elena's はい).

**Output:** `{ phase, onTick, onChoice, onTalkEnd, renderWorld, getHud, playerLabel, talkRequest, moveRequest, failAt, getFade, getSign }`, passed to `GameScene` by `leftRightQuestIsland.tsx`.

**Side effects:** plays Ryuuko's verb and feedback clips and the damage sound.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/leftRightQuestIsland.tsx` | `Training` |

## Exports (layout)

`HALL_W`, `hallH()`, `DOOR_W`, `DOOR_H`, `doorTop`, `doorBottom`, `doorBoxes`, `spawnSpot`, `startSpot`, `FEET_H`, type `LrPhase`.

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/leftRightQuestIsland.tsx` | island size, spawn, `feetH` |
| quests | `src/components/Game/npcs/npcs.ts` | `leftRightNpcs` (`startSpot`, `LrPhase`) |
