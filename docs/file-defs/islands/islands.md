# islands

- **Path:** `src/components/Game/islands/islands.ts`
- **Topic:** islands
- **Purpose:** the hand-written map (placed objects) of each island, 1–5.

## Exports

| Name | Island | Scene doc |
| --- | --- | --- |
| `ISLAND_1` | tropical island (kana) | `docs/scenes/tropical-island.md` |
| `ISLAND_2` | こそあど meadow | `docs/scenes/kosoado-meadow.md` |
| `ISLAND_3` | forest island (に / で), copied from ikko | `docs/scenes/forest-island.md` |
| `ISLAND_4` | port town (は / が, phrases) | `docs/scenes/port-town.md` |
| `ISLAND_5` | final-boss lair (placeholder) | `docs/scenes/volcano.md` |

All are `PlacedObject[]`, registered in `ISLAND_MAPS` (`islands/index.ts`).

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| islands | `src/components/Game/islands/index.ts` | `ISLAND_MAPS` |

## Functions

### `place` (local)

Places one catalog object by its base (bottom-center), in world px from the spawn.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | unique object id |
| `def` | `string` | `OBJECTS` key (`Object/objects.ts`) |
| `dx`, `dy` | `number` | base position from the spawn (world center); -y = up |
| `scale` | `number` | default 1 |
| `interaction` | `Interaction?` | e.g. `{ kind: 'sign', text }` |

**Output:** `PlacedObject` with the top-left worked out from the sprite size × scale.

**Side effects:** none

### `scatter` (local)

Spreads `count` small decorations over a rectangle with a seeded generator (same layout on every load / server and client), skipping spots within `SPAWN_CLEAR` (120 px) of the spawn.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `prefix` | `string` | id prefix (`<prefix>-N`) |
| `defs` | `string[]` | catalog keys, used in turn |
| `rect` | `{ dx, dy, w, h }` | top-left from the spawn and size |
| `count` | `number` | how many |
| `seed` | `number` | layout seed |
| `scale` | `number` | default 0.12 |

**Output:** `PlacedObject[]`

**Side effects:** none

**Used in:** islands 2–5's maps in this file (island 1's calls are commented out).
