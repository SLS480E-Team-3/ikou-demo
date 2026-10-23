# api routes (IslandEditor)

- **Path:** `src/app/api/IslandEditor/route.ts`, `src/app/api/IslandEditor/quests/route.ts`, `src/app/api/IslandEditor/sprites/route.ts`
- **Topic:** island-editor
- **Purpose:** The editor's server endpoints. No login check (spec D-15); all use the admin client.

## `/api/IslandEditor`

- `GET` → `{ islands: [{ id, name }] }`
- `GET ?island=N` → `{ versions: number[] }`
- `GET ?island=N&ver=V` → `{ file: IslandFile }` (404 if missing)
- `POST { file }` → `{ ver, savedAt }`: writes `<island>_ver<max+1>.json`

## `/api/IslandEditor/quests`

- `GET ?island=N` → `{ quests: rows }` (`select('*')`, so it works with or without the new columns)
- `POST { quest: EditorQuest }` → `{ quest: row }`: insert (no id) or update (id). `kana` mirrors a string `target`.

## `/api/IslandEditor/sprites`

- `GET` → `{ sprites: FileSprite[] }` from `sprites/index.json`
- `POST` form `{ file, key, w, h }` → `{ sprite, repoPath? }`: uploads `<key>.<ext>` to the public `sprites` bucket and updates `index.json`. Under `npm run dev` it also writes `public/img/uploads/<key>.<ext>` (`repoPath`), which the dev commits; on Vercel it's Supabase-only.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| island-editor | `src/components/IslandEditor/islandEditor.tsx` | load, open, save |
| island-editor | `src/components/IslandEditor/panels.tsx` | `QuestForm.save` |
| island-editor | `src/components/IslandEditor/assetBox.tsx` | `Upload.submit` |
