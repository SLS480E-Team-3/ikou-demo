# verbs

- **Path:** `src/components/Game/verbs.ts`
- **Topic:** quests
- **Purpose:** The Left or Right quest's verb pool and run builder, copied from `../ikko`.

## Exports

### `VERBS`

14 `{ verb, romaji, en, pair? }`. `pair` is the verb whose meaning is the close decoy (eat/drink, go/come, …); 買う and 待つ have none. Each verb's clip is `public/dialog/ryuuko/<verb>.mp3`.

### `LR_QUESTIONS`, `LR_CLOSE_FROM`

A run is 10 questions; from index 5 on the decoy is the close one.

### `buildRun`

`() => Question[]`: 10 questions, no verb twice. Questions 1–5 get a far decoy, 6–10 the paired verb's meaning; the right door is left or right at random.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| quests | `src/components/Game/Scene/leftRightTraining.ts` | `useLeftRightTraining` (each run) |

### Types

`Verb`, `Side` (`'left' | 'right'`), `Question` (`{ verb, romaji, answer, decoy, correctSide }`).
