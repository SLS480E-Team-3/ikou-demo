# Hiroko tutorials for Matching and InBetween (2026-10-23)

## Asked
- Hiroko tutorial dialogs for the Matching quest (Ryuuko gives a word, 3 areas, stay in the right meaning until the timer runs out) and the InBetween quest (Ryuuko tells you your word, a sentence with one word missing, stay in the right gap until the timer runs out).

## Done (on `main`, not committed)
- `hiroko_en.json`: `tut-matching-touch|keys`, `tut-inbetween-touch|keys` (4 rule lines + controls + hand-off each).
- `QuestType` + `'matching' | 'inbetween'`; `QuestKind` is now just `QuestType`. `Condition` type and toNPCProps' `CONDITION` take the new labels.
- `matchingQuestIsland.tsx` / `inBetweenQuestIsland.tsx`: Hiroko via `useTutorial`, same as dodge; optional `tutorial` prop.
- `QuestScene.tsx`: one shared `tutorial` object, also passed to `MatchingQuestIsland`.
- `/api/Tutorial`: accepts `matching` and `inbetween`. No SQL needed (`user_tutorials.quest_type` is plain text).
- Docs: quest-tutorials.md, dialogs-and-voice.md condition table, the two file-defs.

## Checked
- `npx tsc --noEmit` clean.
- /MobDev/QuestMatching and /MobDev/QuestInBetween at 375 x 812: Hiroko stands right of Ryuuko, はい plays the touch tutorial, いいえ the hand-off line.

## Next
- Render Hiroko's 10 new clips (`dialog.py render` lives in `../ikko/python` and writes to `../ikko/public/dialog`; copy the mp3s into `public/dialog/hiroko_en/`). Until then the new lines are silent.
- `inbetween` isn't a quest_type in /IslandEditor or the quest page yet, so its tutorial only shows on /MobDev.

## Then: timerMs prop
- `MatchingQuestIsland` / `InBetweenQuestIsland` take `timerMs?` → `useMatchingTraining` / `useInBetweenTraining` `timerMs?` (defaults: TIMER_MS 10000 / 5000). Read through a ref so onTick / getHud stay stable.
- Not wired from a quest row yet (QuestScene, /IslandEditor); that is where difficulty would set it.

## Then: timer in /IslandEditor
- QuestForm: `timer` ms input under target → `EditorQuest.timer_ms` → quests route (sent only when the key is present) → new column `quests.timer_ms` (SQL appended to docs/SQL-query.md, **needs running in Supabase**).
- Quest page reads `timer_ms` → `QuestScene.timerMs` → `MatchingQuestIsland`; /MobDev island preview passes it too (`QuestPick.timerMs`).
- Spec (island-editor.spec.json), editor-ui / api-routes file-defs updated. Checked: tsc clean, field shows under target in /IslandEditor; save not tried (column not added yet).
- After the user ran the timer_ms SQL: saved timer 4000 on quest #72 (island 2, matching, adnominal) in /IslandEditor → DB had 4000 → /Game/2/72 cyan bar lasted 4000 ms. Restored #72 to 10000. Answering いいえ to Hiroko there saved a user_tutorials 'matching' row for the logged-in account.
