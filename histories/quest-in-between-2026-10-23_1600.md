# QuestInBetween (2026-10-23)

## Asked
- New issue "QuestInBetween": a sentence with one missing word, the player is assigned the word, 5 s timer, stand in the gap where it completes the sentence. Example: 私はこのさかながすき → floor 私 は さ か な が す き with equal gaps, word この → stand between は and さ.
- Make a test quest with the example.

## Done (branch `Issue12`, cut from `main`, not committed)
- Issue #12 created: https://github.com/SLS480E-Team-3/ikou-demo/issues/12
- New `Scene/inBetweenTraining.ts` (`useInBetweenTraining`, `rowLayout`, `IB_QUESTIONS`) and `Scene/inBetweenQuestIsland.tsx` (matching quest's dojo shell + sentence card).
- `npcs.ts`: `inBetweenNpcs(w, h, phase)`.
- `ryuuko.json`: `ib-intro` (正しいところに立って！ / 準備はできてる？). `Condition` + toNPCProps' CONDITION take `ib-intro`. Verdicts reuse `mt-correct` / `mt-wrong`.
- MobDev screen `QuestInBetween` (`/MobDev/QuestInBetween`).
- Docs: file-defs `quests/inBetweenTraining.md`, `inBetweenQuestIsland.md`; quest types in `quests-and-levelup.md`; MobDev screen lists.

## Decisions (mine, to confirm)
- Gaps also before the first and after the last character, so a missing first / last word works later.
- Tiles and gaps 32 px (player is 24 px wide); the row is 544 px, wider than a phone shows, so a top card repeats the whole sentence and "your word: この"; the player's name tag shows the word too. `fitWhole` lets the player pinch out.
- Wrong gap (or no gap) = red flash + 違うわよ！ and the same sentence again, like the matching quest.

## Checked
- `npx tsc --noEmit` clean.
- /MobDev/QuestInBetween at 375 x 812: intro talk → はい → row + card + 5 s timer + dashed gaps; standing above the row when time ran out → wrong, same sentence again.
- Not checked: walking into the は/さ gap for 正解！ (the browser pane was hidden, so frames were throttled and scripted key holds didn't move the player).

## Next
- Render Ryuuko's new clip 正しいところに立って.mp3 (python/ isn't in this repo; run dialog.py render from ../ikko).
- More sentences; a quest_type / target for it in /IslandEditor and the quest page (#7).
