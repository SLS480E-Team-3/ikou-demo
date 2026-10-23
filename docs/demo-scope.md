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
- `.env` is copied from `../ikko`, so the demo uses the **same Supabase project**. If its `islands` table has 2–5 unlocked, `/Game/2` etc. still load, with an empty map.
- Unused assets in `public/` (other islands' sprites, verb/particle voice lines) could be pruned later.
