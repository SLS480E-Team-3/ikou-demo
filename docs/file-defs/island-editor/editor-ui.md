# editor UI

- **Path:** `src/app/IslandEditor/page.tsx`, `src/components/IslandEditor/{islandEditor,canvas,assetBox,panels,phoneView,history,types}.ts(x)`
- **Topic:** island-editor
- **Purpose:** The `/IslandEditor` page (all files are DEV).

## `page.tsx` → `IslandEditorPage`
Loads `IslandEditor` with `next/dynamic` `ssr: false`. Not in the proxy matcher (no login).

## `islandEditor.tsx` → `IslandEditor` (default)
Owns all state: islands, versions, picked / opened ver, quests, uploaded sprites, selection, tool, phone toggle, zoom, status, and the island via `useHistory<IslandFile>`. `loadIsland(id, ver?)` opens a ver (newest by default; `0` = code). `save()` POSTs and switches to the new ver. `drop(tool, x, y)` places an asset's bottom-center at the click (a tile's center, appended to the end of the path). `remove()` / `duplicate()` act on the selection. Shortcuts: ⌘Z, ⇧⌘Z / ⌘Y, ⌘D, ⌘S, ⌫, Esc (ignored while typing in a field).

## `history.ts` → `useHistory(initial)`
Whole-state undo / redo. `commit(next, key?)` = one step (same key within 800 ms merges, for typing). `begin()` + `live(next)` = one step for a drag. `reset(value)` clears history. Keeps 200 steps.

## `canvas.tsx` → `EditorCanvas` (default), types `ItemKind`, `Selection`, `Tool`
Draws the 1400×2000 world scaled by `zoom`: bands (dashed separator line), the tile path (`TilePath`, grab boxes above every object, label = path number + `Q<id>`), objects (by bottom edge; selected on top with a scale handle), NPCs (body + name + `Q<id>`). Ground click = drop the tool / deselect. Item pointerdown = select, then drag moves (undo step opens on the first move). The corner handle scales around the bottom-center.

## `assetBox.tsx` → `AssetBox` (default)
`asset box/` → `npcs/` (NPC_SCRIPTS), `tiles/` (one `tile` entry) and `objects/` (OBJECTS + uploaded). Click picks / unpicks the tool. `Upload`: file, key (from the file name), w / h (from the image), POST to `/api/IslandEditor/sprites`.

## `panels.tsx` → `SelectionPanel`, `IslandPanel`
`SelectionPanel`: object x / y / scale / sign, tile x / y / path order (↑ earlier / ↓ later) / quest dropdown plus `QuestForm`, or NPC x / y / quest dropdown plus `QuestForm` (title, level selector of `LEVELS` (a saved level not in it stays as an extra option), type, points, target: kana, answer / decoys for door, or a こそあど group dropdown for matching, which also sets an empty / vocab level to koSoADo). Saves the quest to Supabase and assigns it. Duplicate / Delete buttons. `IslandPanel`: bg color, then sections (id, color, start, end, separator, solid, wave, reorder, delete, add).

## `phoneView.tsx` → `PhoneView` (default)
The real `GameScene` in a `MobileView` phone frame, built from the file (`fileBg`, `layoutNpcs`, `registerSprites`). Touch / mouse / WASD walk the player. はい on a quest offer only shows which quest would open. With tiles it is in tile mode (`useTileWalk`): tap a tile to walk, はい shows the quest and marks the tile cleared for this view only (reset cleared button).

## `types.ts`
`EditorQuest` (quests row), `QuestTarget` / `DoorTarget` / `MatchingTarget` (`{ group }`), `QUEST_TYPES` (dodge, matching, …), `LEVELS` (vocab, koSoADo, particles, basicPhrases).
