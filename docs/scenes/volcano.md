# Scene: volcano (island 5, final-boss lair)

- **Island id:** 5 in this demo (ikko has this scene as island 2)
- **Status:** placeholder, built 2026-10-22 from ../ikko's volcano scene plus island 1's volcano props. The boss is planned in GitHub issue "Island 5" (#5).

The world is 1400 x 2000 world px. The player spawns at (700, 1000), on the red soil.

## Sections

| Section | Rectangle `{x, y, w, h}` | Color | What it is |
|---|---|---|---|
| volcano | `0, 0, 1400, 1700` | `#7a3f2e` | Dark red-brown volcano soil, the spawn. |
| magma | `0, 1700, 1400, 300` | `#f08a24` | `merge`, `solid`, `wave`: island 1's ocean in orange; rises and falls and pushes the player up. |

## Props (all reused)

| Key | Kana | Romaji | English | Count | Sign |
|---|---|---|---|---|---|
| `volcano` | かざん | kazan | volcano | 1 (scale 2, straight up from the spawn: the boss's spot) | yes |
| `lava-lake` | ようがん | yōgan | lava | 1 | yes |
| `fire` | ひ | hi | fire | 3 | first |
| `rock` | いわ | iwa | rock | 3 | first |
| plants | | | | 12 (`dry-grass`, `dead-twig`, `ember`, `pebbles`) | no |

## Where it is in the code
- Sections: `ISLAND_SECTIONS[5]`, ground `ISLAND_BG[5]` in `gameScene.tsx`.
- Map: `ISLAND_5` in `src/components/Game/islands/islands.ts`.
