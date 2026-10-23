# Demo scope

This repo is a bare-minimum copy of `../ikko`, made 2026-10-22.

## In
- Framework: Next.js App Router setup, `package.json`, `tsconfig.json`, `src/proxy.ts`, Supabase utils
- Auth pages + APIs: SignUp, LogIn, InfoRecovery, EditInfo
- Dev pages: `/Dev`, `/MobileTester`, `/MobDev`, `/MobDev/<ScreenType>`
- Island 1 (tropical island) and its dodge quest: `DodgeQuestIsland`, `dodgeTraining`, plus the shared `training.ts`, `tutorial.ts`, `gameScene.tsx`, NPCs and entity renderers
- `public/` assets as-is (images, dialog mp3s, BGM, fonts)

## Out
- Islands 2–5: maps, ground sections, colors, BGM entry
- Quest islands other than dodge: catch (`questIsland`), shoot, door (left/right), particle
- `verbs.ts`, `particles.ts`, `islands/quests/island_2_quests.ts`
- `python/` (dialog/voice generation), `ikko-vision.pdf`, `.claude/skills`

## How the cut works
- `ISLAND_COUNT = 1` in `gameScene.tsx`; `ISLAND_MAPS` / `ISLAND_SECTIONS` / `ISLAND_BG` only have island 1.
- `islandQuestType()` always returns `'dodge'`; `QuestScene` and `islandPreview` always render `DodgeQuestIsland`.
- `/api/Tutorial` accepts only `'dodge'`.
- `QuestType` in `tutorial.ts` and the `tut-*` dialog conditions still list the other types (harmless, unused).

## Notes
- Since 2026-10-22 the demo has **its own Supabase project** (`mgwosxdeykucuzrpfchn`), separate from ikko's. A fresh project is set up by running `docs/supabase-setup.sql` (the whole schema in order: tables, RLS, signup trigger, login lookup, seed quests, tutorials, island-editor columns and buckets). `.env` needs that project's `SUPABASE_SECRET_KEY`.
- Unused assets in `public/` (other islands' sprites, verb/particle voice lines) could be pruned later.
