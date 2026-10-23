# layoutNpcs

- **Path:** `src/components/Game/islands/layoutNpcs.ts`
- **Topic:** island-editor
- **Purpose:** Turns a saved island's NPCs into the `NPCProps` GameScene draws, with the quest picked in the editor.

## Functions

### `layoutNpcs(npcs, quests)`

Builds each NPC from `NPC_SCRIPTS[npc]` at its saved spot. With a `questId` that matches a quest, attaches that quest and sets the offer line via `withQuestLine` (label = string target, else kana, else title). Without one, drops the `quest` dialog entry so the NPC just talks. Unknown npc keys are skipped.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `npcs` | `FileNpc[]` | saved NPCs |
| `quests` | `LayoutQuest[]` | `{ id, title, kana, target?, status? }` of the island |

**Output:** `NPCProps[]`

**Side effects:** none

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| game | `src/components/Game/Scene/IslandScene.tsx` | `npcs` when `layout` is set |
| island-editor | `src/components/IslandEditor/phoneView.tsx` | `scene` memo |
