# Scene: port-town (island 4)

- **Island id:** 4
- **Status:** built 2026-10-22 from reused sprites. Quests are planned in GitHub issue "Island 4" (#4).
- **Vision (ikko-vision.pdf):** island 4 teaches basic phrases and は / が, "theme based around a port town", where a character talks and the player picks replies.

The world is 1400 x 2000 world px. The player spawns at (700, 1000), on the town street.

## Sections

| Section | Rectangle `{x, y, w, h}` | Color | What it is |
|---|---|---|---|
| hill | `0, 0, 1400, 500` | `#a9cf7a` | Green hill behind the town. |
| town | `0, 500, 1400, 900` | `#c9c3b5` | Stone-grey streets, the spawn. `merge`. |
| pier | `0, 1400, 1400, 250` | `#b88a5a` | Wooden pier. No `merge`, so its top edge stays straight. |
| harbor | `0, 1650, 1400, 350` | `#5fa8d8` | Deeper blue water. `merge`, `solid`, `wave`. |

## Props (all reused)

| Key | Kana | Romaji | English | Where | Count | Sign |
|---|---|---|---|---|---|---|
| `pine-tree` | まつ | matsu | pine tree | hill | 1 | yes |
| `tree` | | | | hill | 2 | no |
| `cabin` | いえ | ie | house | town, upper row | 2 | first |
| `cabin` | みせ | mise | shop | town, lower row | 2 | first |
| `woodpile` | にもつ | nimotsu | cargo | town | 2 | first |
| `fish` | さかな | sakana | fish | pier (fish stall) | 2 | first |
| `rock` | | | | pier edge | 1 | no |
| `boat` | ふね | fune | boat | harbor | 3 | first |
| plants | | | | hill 5, town 6, pier 3 | | no |

The street 100 px either side of the spawn's x stays open from the pier up to the hill.

## Where it is in the code
- Sections: `ISLAND_SECTIONS[4]`, ground `ISLAND_BG[4]` in `gameScene.tsx`.
- Map: `ISLAND_4` in `src/components/Game/islands/islands.ts`.
