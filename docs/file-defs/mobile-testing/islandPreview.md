# islandPreview

- **Path:** `src/components/Game/Scene/islandPreview.tsx`
- **Topic:** mobile-testing
- **Purpose:** The no-login island screen of `/MobDev/GameScene` and MobileTester: plays an island's saved `<island>_ver<N>.json` (or the code's map), with prev / next and the quest island in place of the quest page.

## Functions

### `IslandPreview` (default export)

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `sensitivity` | `number?` | stick sensitivity |
| `start` | `number` | first island (clamped to 1..ISLAND_COUNT) |
| `tint` | `boolean` | paint the page behind the scene (full-screen /MobDev) |
| `ver` | `number?` | saved version of the start island; missing = newest, 0 = code |

**Output:** JSX. With a saved version: `SavedIsland` plus the island buttons, labelled with the file name. A load error adds a red `load failed (...)` line under the label. Without one: the code's map, NPCs by kana row (row buttons), labelled `code (islands.ts)`. はい swaps in `DodgeQuestIsland`.

**Side effects:** fetches `/api/IslandEditor` (versions, file) and `/api/IslandEditor/quests` for the island on screen, again on prev / next.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `SCREENS.GameScene` |
| mobile-testing | `src/app/MobileTester/page.tsx` | game scene page |

### `loadSaved(island, ver?)` (local)

The asked or newest saved file and the island's quests. **Output:** `Promise<{ island, ver, file | null, quests, error? }>`. A failed request still falls back (no file = code map, no quests), and the first failure is kept in `error` (`versions: HTTP 500`, `1_ver99.json: HTTP 404`, `quests: network error`). **Side effects:** network.

### `SavedIsland` (local)

A saved island built like `IslandScene` with a layout (`fileBg`, `registerSprites`, `layoutNpcs`, tile mode via `useTileWalk`). はい on an NPC or tile calls `onQuest(kana)` with the quest's string target, else kana, else あ; a tile's はい also calls `onClear`. The cleared tiles live in `IslandPreview` (per island + ver), so they survive the quest island and the clear animation plays on the way back.
