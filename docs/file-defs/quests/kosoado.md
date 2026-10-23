# kosoado

- **Path:** `src/components/Game/kosoado.ts`
- **Topic:** quests
- **Purpose:** The four こそあど groups the matching quest targets (issue #8), with each word's romaji and English.

## Exports

### `KOSOADO_GROUPS`, `KosoadoGroup`

`['pronoun', 'adnominal', 'adverb', 'naAdjective']`: demonstrative pronouns (これ…), pre-noun adjectivals (この…), adverbs (こう…), adjectival nouns (こんな…). A matching quest stores one as its target `{ group }`.

### `KOSOADO`

`Record<KosoadoGroup, { name, words: { word, romaji, en }[] }>`, words in こ・そ・あ・ど order. そ / あ meanings say "(by you)" / "(over there)".

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/matchingTraining.ts` | `questionsFor` |
| island-editor | `src/components/IslandEditor/panels.tsx` | `QuestForm` group dropdown |

### `isKosoadoGroup(v)`, `groupOf(target)`

Type guard for a group key; `groupOf` reads `{ group }` from a quests row's target (anything else → `undefined`).

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/app/Game/[island]/[quest]/page.tsx` | `QuestPage` (picks matching) |
| mobile-testing | `src/components/Game/Scene/islandPreview.tsx` | `SavedIsland` `pickOf` |
| mobile-testing | `src/app/MobDev/[screen]/screenHost.tsx` | `?group=` |
| island-editor | `src/components/IslandEditor/panels.tsx` | `QuestForm` initial group |
