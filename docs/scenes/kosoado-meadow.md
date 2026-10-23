# Scene: kosoado-meadow (island 2)

- **Island id:** 2
- **Status:** built 2026-10-22 from reused sprites. Quests are planned in GitHub issue "Island 2" (#2).
- **Vision (ikko-vision.pdf):** island 2 teaches こ・そ・あ・ど. "Very open and grassy", so the player can see what is near them (こ), near the listener (そ) and far from both (あ).

The world is 1400 x 2000 world px. The player spawns at (700, 1000), in the meadow.

## Sections

| Section | Rectangle `{x, y, w, h}` | Color | What it is |
|---|---|---|---|
| hill | `0, 0, 1400, 600` | `#8fbf63` | Darker grass at the top; the far (あ) landmarks. |
| meadow | `0, 600, 1400, 1000` | `#b5d98a` | Wide open grass, the spawn. `merge`. |
| beach | `0, 1600, 1400, 100` | `#f3e9c6` | Thin sand strip. `merge`. |
| ocean | `0, 1700, 1400, 300` | `#87ceeb` | `merge`, `solid`, `wave`, like island 1. |

## Props (all reused)

| Key | Kana | Romaji | English | Where | Count | Sign |
|---|---|---|---|---|---|---|
| `tree` | き | ki | tree | hill, one straight up from the spawn | 3 | first |
| `apple-tree` | りんごのき | ringo no ki | apple tree | meadow, near the spawn (right) | 1 | yes |
| `rock` | いわ | iwa | rock | meadow, up-left | 1 | yes |
| `mushroom` | きのこ | kinoko | mushroom | meadow, down-left | 1 | yes |
| `stump` | きりかぶ | kirikabu | tree stump | meadow, down-right | 1 | yes |
| plants | | | | hill 6, meadow 10, beach 3 (`seashell`, `starfish`) | | no |

Few props on purpose: each sits at a clearly different distance, and the column 100 px either side of the spawn's x is open up to the hill.

## Where it is in the code
- Sections: `ISLAND_SECTIONS[2]`, ground `ISLAND_BG[2]` in `gameScene.tsx`.
- Map: `ISLAND_2` in `src/components/Game/islands/islands.ts`.
