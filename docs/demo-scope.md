# Demo scope

This repo is a bare-minimum copy of `../ikko`, made 2026-10-22.

## In
- Framework: Next.js App Router setup, `package.json`, `tsconfig.json`, `src/proxy.ts`, Supabase utils
- Auth pages + APIs: SignUp, LogIn, InfoRecovery, EditInfo
- Dev pages: `/Dev`, `/MobileTester`, `/MobDev`, `/MobDev/<ScreenType>`
- Islands 1–5 as walkable scenes (since 2026-10-22, following `../ikko/ikko-vision.pdf`): 1 tropical island, 2 こそあど meadow, 3 forest island (copied from ikko), 4 port town, 5 final-boss lair (ikko's volcano, placeholder). Scene notes in `docs/scenes/`
- Island 1's dodge quest: `DodgeQuestIsland`, `dodgeTraining`, plus the shared `training.ts`, `tutorial.ts`, `gameScene.tsx`, NPCs and entity renderers
- `public/` assets as-is (images, dialog mp3s, BGM, fonts)

## Out
- Islands 2–5's own quests: each is planned in a GitHub issue ("Island 2" #2 … "Island 5" #5). Until then they have 5 placeholder quests each (あ–お) that run the dodge quest
- New NPC lines / voice for islands 2–5 (they reuse island 1's five NPCs and food talk)
- BGM entries for islands 2–5
- Quest islands other than dodge: catch (`questIsland`), shoot, door (left/right), particle
- `verbs.ts`, `particles.ts`, `islands/quests/island_2_quests.ts`
- `python/` (dialog/voice generation), `ikko-vision.pdf`, `.claude/skills`

## How the cut works
- `ISLAND_COUNT = 5` in `gameScene.tsx`; `ISLAND_MAPS` / `ISLAND_SECTIONS` / `ISLAND_BG` have islands 1–5. The DB rows for islands 2–5 and their placeholder quests are the "Islands 2–5" block in `docs/SQL-query.md`.
- `islandQuestType()` always returns `'dodge'`; `QuestScene` and `islandPreview` always render `DodgeQuestIsland`.
- `/api/Tutorial` accepts only `'dodge'`.
- `QuestType` in `tutorial.ts` and the `tut-*` dialog conditions still list the other types (harmless, unused).

## Notes
- Since 2026-10-22 the demo has **its own Supabase project** (`mgwosxdeykucuzrpfchn`), separate from ikko's. A fresh project is set up by running `docs/supabase-setup.sql` (the whole schema in order: tables, RLS, signup trigger, login lookup, seed quests, tutorials, island-editor columns and buckets). `.env` needs that project's `SUPABASE_SECRET_KEY`.
- Unused assets in `public/` (other islands' sprites, verb/particle voice lines) could be pruned later.
