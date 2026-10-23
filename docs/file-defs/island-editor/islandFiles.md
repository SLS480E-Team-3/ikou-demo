# islandFiles

- **Path:** `src/utils/islandFiles.ts`
- **Topic:** island-editor
- **Purpose:** Server-only reads and writes of saved island versions in the `island-editor` Supabase Storage bucket (admin client).

## Functions

### `listVersions(islandId)` → `Promise<number[]>`
Saved vers of one island, oldest first. Missing bucket = `[]`. **Side effects:** Storage list.

### `readIslandFile(islandId, ver)` → `Promise<IslandFile | null>`
One parsed version. **Side effects:** Storage download.

### `latestIslandFile(islandId)` → `Promise<IslandFile | null>`
The newest version, or `null` when none is saved. **Side effects:** Storage list + download.

### `saveIslandFile(file)` → `Promise<IslandFile>`
Writes `ver = max + 1` with `upsert: false` (never overwrites) and stamps `savedAt`. Throws on a Storage error. **Side effects:** Storage upload.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| island-editor | `src/app/api/IslandEditor/route.ts` | `GET`, `POST` |
| game | `src/app/Game/[island]/page.tsx` | `layout: await latestIslandFile(islandId)` |
