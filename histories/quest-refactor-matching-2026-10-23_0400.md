# Quest refactor + matching quest prototype (2026-10-23)

## Asked
- New issue "Quest refactor" (#7): quest fields title, level (vocab | koSoADo | particles | basicPhrases | final later), type (dodge | matching | reply | final, last three TBD), points, target (depends on type, TBD).
- Sub-issue "Matching quest for koSoADo" (#8) under #7, same dojo island: Ryuuko's bubble shows 「これ」, Red / Blue / Green areas with "this" / "that" / "which", a 3 s timer after the areas appear, stand in the box when it runs out, 正解！ → next word (それ). Prototype with これ.
- Then: start building.

## Done (branch `Issue8`, cut from `Issue6-next`, not committed)
- New `Scene/matchingTraining.ts` (`useMatchingTraining`, `areaBoxes`, `MT_QUESTIONS`) and `Scene/matchingQuestIsland.tsx` (dodge's dojo shell, timer strip, red flash, no hp bar).
- `npcs.ts`: `matchingNpcs(w, h, phase)`: Ryuuko at the center, Elena after a clear.
- `ryuuko.json`: `mt-intro` (正しい色に入って！ / 準備はできてる？), `mt-correct` (正解！), `mt-wrong` (違うわよ！). `Condition` type and toNPCProps' CONDITION regex take `mt-*`.
- `charBlock.tsx` `TargetBubble`: optional `w` so her bubble fits これ / 正解！.
- MobDev screen `QuestMatching` (`/MobDev/QuestMatching`).
- Docs: `docs/file-defs/quests/matchingTraining.md`, `matchingQuestIsland.md`, quest types in `quests-and-levelup.md`, MobDev screen lists.

## Decisions (mine, to confirm)
- No fail / hp in the prototype: a wrong pick (or no area) flashes red, says 違うわよ！ and asks the same word again (labels reshuffled).
- "In the box" = the player's feet (4 px above the body's bottom) at its center x, since a center test looked wrong on screen.
- Areas 72 x 90 px, 8 px apart, under Ryuuko; 232 px wide so they fit a 375 px phone at zoom 1.5.
- No Hiroko tutorial yet; not wired to the quest page (QuestScene still always dodge) — that belongs to #7's type field.

## Checked
- `npx tsc --noEmit` clean.
- /MobDev/QuestMatching at 375 x 812: intro talk → はい → これ bubble → areas + timer; standing outside → ちがうわよ！ + flash, same word again; walking into "this" → せいかい！ → おつかれさま！ with Elena out.
- Console: only 404s for the two new clips (正しい色に入って.mp3, 正解.mp3).

## Next
- Render the new Ryuuko clips: `python/` isn't in this repo, so run dialog.py render from `../ikko` (or copy the mp3s into `public/dialog/ryuuko/`).
- Add それ / あれ / どれ (English labels for それ vs あれ TBD), then the other こそあど groups.
- #7: read `quests.quest_type` on the quest page and pick the island component from it.
