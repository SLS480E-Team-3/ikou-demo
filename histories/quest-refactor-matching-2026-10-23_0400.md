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

## Follow-up: QuestDodge zooms out to the whole dojo
- `gameScene.tsx`: new `fitWhole` prop. With it, the zoom-out floor is the whole-world fit (min of screen w / world w and screen h / world h) instead of the width fit, and the wheel / pinch may go below ZOOM_MIN down to it (`clampZoom` / `wheelZoom` take a `min`, fed from `zoomMinRef`). Without it nothing changes.
- `dodgeQuestIsland.tsx` passes `fitWhole`. The matching quest (same dojo) doesn't yet.
- Checked on /MobDev/QuestDodge: 375 x 812 zooms out to the full dojo (walls, kamidana, entrance) centered; 1400 x 900 too (it used to stop at the width fit, cutting the top and bottom). `npx tsc --noEmit` clean. Not committed.

## Follow-up: four こそあど matching quests + IslandEditor
- New `src/components/Game/kosoado.ts`: groups pronoun (これ…), adnominal (この…), adverb (こう…), naAdjective (こんな…), each word with romaji and English ("(by you)" / "(over there)" tell そ and あ apart).
- `matchingTraining.ts`: `group` arg, `questionsFor(group)` replaces MT_QUESTIONS; each ask = answer + 2 random of the other three; labels 12 px and wrap. Pick timer now counts frame time (onTick dt) instead of performance.now(), since a throttled tab ran the 3 s out while the player couldn't move.
- Routing: quests row `quest_type: 'matching'` + target `{ group }`. Quest page (`groupOf`) → QuestScene → MatchingQuestIsland; MobDev saved islands (`pickOf`) open it too; `/MobDev/QuestMatching?group=<key>`.
- Types: `QuestKind = QuestType | 'matching'` in tutorial.ts (QuestType itself would need tut-matching-* lines). Editor `QUEST_TYPES` + matching, `LEVELS` + koSoADo, `MatchingTarget`.
- IslandEditor QuestForm: matching shows a target dropdown of the four groups; saves `{ group }`; picks level koSoADo over an empty / vocab level.
- The fork session made the areas solid (AREA_ALPHA 1) in this checkout.
- Checked: tsc clean; /MobDev/QuestMatching?group=naAdjective shows こんな with wrapped labels and こんな → せいかい！; the editor form shows matching / koSoADo / the group dropdown (nothing saved). A full 4-word scripted run couldn't finish because the browser pane was hidden (rAF throttled). Not checked: a saved matching quest on /Game.

## Follow-up: level is a selector
- QuestForm's level is a `<select>` of `LEVELS`, now issue #7's list (vocab, koSoADo, particles, basicPhrases; final left out), plus (none). A saved level outside the list (old `meaning`) shows as an extra option. Checked in /IslandEditor (nothing saved).
