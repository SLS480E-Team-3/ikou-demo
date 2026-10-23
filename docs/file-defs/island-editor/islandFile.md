# islandFile

- **Path:** `src/components/Game/islands/islandFile.ts`
- **Topic:** island-editor
- **Purpose:** The saved-island JSON format (`<island>_ver<N>.json`) and the conversions between it and what GameScene draws.

## Exports

### Types `IslandFile`, `FileSection`, `FileNpc`, `FileTile`, `FileSprite`

`IslandFile` = `{ islandId, ver, savedAt, bgColor, sections, objects: PlacedObject[], npcs, tiles?, sprites }`. `FileTile` = `{ id, x, y (center), questId? }`; the array order is the path order. With one or more tiles the island plays as a tile path (`islands/tiles.tsx`); files without `tiles` stay free roam. `FileSection` = `{ id, start?, end, color, separator?, solid?, wave? }`. `FileNpc` = `{ id, npc (dialogs json key), x, y (body center), questId? }`. `FileSprite` = an uploaded `ObjectDef` plus its `key`.

### Constants `ISLAND_FILE_BUCKET` (`island-editor`), `SPRITE_BUCKET` (`sprites`), `FILE_RE`, `fileName(islandId, ver)`

Bucket names and the `<island>_ver<N>.json` naming rule.

### `sectionStart(sections, i)`

A section's real start: its own `start`, else 0 for the first band, else the end of the band above. **Output:** `number`. **Side effects:** none.

### `toBgSections(sections)`

`FileSection[]` → `BgSection[]`. Each band is drawn from its separator (default: start) to its end; every band but the first gets `merge` (the dithered border). **Side effects:** none.

### `fromBgSections(sections)`

The code's `ISLAND_SECTIONS` → `FileSection[]` (keeps `start` only when it isn't the band above's end). **Side effects:** none.

### `fileBg(file)`

The `BGProps` for a saved island: `islandBg(islandId)` with the file's color and bands. **Side effects:** none.

### `fileFromCode(islandId)`

The island as the code has it (islands.ts map, sections, placeNpcs spots) as an `IslandFile` with `ver: 0`. **Side effects:** none.

### `registerSprites(sprites)`

Adds uploaded sprites to the shared `OBJECTS` catalog so GameScene can resolve their keys. **Side effects:** mutates `OBJECTS`.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| island-editor | `src/components/IslandEditor/*.tsx` | editor state, canvas, phone view, upload |
| island-editor | `src/utils/islandFiles.ts` | bucket reads / writes |
| island-editor | `src/app/api/IslandEditor/*` | routes |
| game | `src/components/Game/Scene/IslandScene.tsx` | `layout` prop: `fileBg`, `registerSprites` |
