import type { Interaction, PlacedObject } from "../Object/gameObject"
import { OBJECTS } from "../Object/objects"
import { BG_H, BG_W } from "../Scene/gameScene" // imports: **none** -> **BG_W, BG_H**, mechanism: the tower is placed relative to the world center

const place = (id: string, def: string, dx: number, dy: number, scale = 1, interaction?: Interaction): PlacedObject => {
    const { w, h } = OBJECTS[def].sprite
    return {
        id,
        def,
        x: BG_W / 2 + dx - (w * scale) / 2,
        y: BG_H / 2 + dy - h * scale,
        interaction,
        scale,
    }
}
// places an object by where its base stands: (dx, dy) is the bottom-center
// of the sprite, in world px from the spawn (world center; -x = left,
// -y = up). The top-left that PlacedObject stores is worked out from the
// catalog's sprite size times scale, so no sprite width / height is typed
// into the map, and changing scale or the sprite keeps the base in place

export const ISLAND_1: PlacedObject[] = [ // island: **2 (ISLAND_2)** -> **1 (ISLAND_1)**, mechanism: the islands were renumbered (1 -> 5, 2 -> 1, 3 -> 2)
    // beach (world y 900-1700, dy -100..700)
    place('palm-tree-1', 'palm-tree', -220, 60, 0.6, { kind: 'sign', text: 'やしのき (yashi no ki) = palm tree' }),
    place('palm-tree-2', 'palm-tree', 260, 240, 0.6),
    // forest (world y 500-900, dy -500..-100)
    place('tree-2-1', 'tree', -450, -180, 0.6, { kind: 'sign', text: 'き (ki) = tree' }),
    place('tree-2-2', 'tree', -250, -330, 0.6),
    place('tree-2-3', 'tree', 280, -200, 0.6),
    // place('mushroom-1', 'mushroom', -540, -380, 0.15, { kind: 'sign', text: 'きのこ (kinoko) = mushroom' }),
    // place('mushroom-2', 'mushroom', 200, -420, 0.15),
    // volcano (world y 0-500, dy -1000..-500)
    place('volcano-1', 'volcano', 0, -630, 2, { kind: 'sign', text: 'かざん (kazan) = volcano' }), // scale: **1.4** -> **2**, mechanism: the remade volcano sprite is half as tall (256x132, was 256x256), so it is drawn larger to stay the landmark of the section (512x264 world px)
    // place('lava-lake-1', 'lava-lake', -400, -640, 0.2, { kind: 'sign', text: 'ようがん (yōgan) = lava' }),
    // place('rock-1', 'rock', 330, -600, 0.3, { kind: 'sign', text: 'いわ (iwa) = rock' }),
    // place('rock-2', 'rock', 520, -760, 0.3),
    place('fire-1', 'fire', -210, -560, 0.2, { kind: 'sign', text: 'ひ (hi) = fire' }),
    place('fire-2', 'fire', 250, -800, 0.2),
    // ...scatter('beach-plant', ['beach-grass', 'seashell', 'starfish', 'driftwood'], { dx: -660, dy: -60, w: 1320, h: 720 }, 9, 11), // h, count: **1040, 12** -> **720, 9**, mechanism: the beach now ends at world y 1700 (the ocean is below it), so the rectangle stops 40 px above the shore and the count drops with the area
    // ...scatter('forest-plant', ['fern', 'grass-tuft', 'clover', 'small-bush'], { dx: -660, dy: -460, w: 1320, h: 350 }, 6, 22),
    // ...scatter('volcano-plant', ['dry-grass', 'dead-twig', 'ember', 'pebbles'], { dx: -660, dy: -940, w: 1320, h: 430 }, 6, 33),
] // ground plants: **none** -> **three scatter() calls**, mechanism: the sections are flat colors now, so four small walk-through plants per section are spread over each band in place of a texture. Each rectangle sits 40 px inside its section so no plant's base crosses a border; the beach is the tallest band, so it gets 12, the others 6 (one or two in a phone view)
// amount and size: **32 / 18 / 18 plants at scale 0.2, 26 props** -> **12 / 6 / 6 plants at scale 0.12, 21 props**, mechanism: the island was crowded and the small things were too large. scatter()'s default scale is 0.12 (a plant is about 31 world px wide, was 51); coconut, apple and banana are 0.12, flower and mushroom 0.15, rock 0.3, fire 0.2; one repeat each of palm-tree, coconut, tree, flower and rock is removed. Every word still has its signed first placement
// props: **21, with coconut, apple, flower and banana** -> **13**, mechanism: the two placements of each of the four are removed (and their catalog entries in objects.ts); the beach keeps the palm trees, the forest the trees and mushrooms
// island 1's map, the tropical-island scene (docs/scenes/tropical-island.md).
// Each object stands inside its ground section (ISLAND_SECTIONS[1] in
// gameScene.tsx): beach around and below the spawn, forest above it, volcano
// at the top. The column 100 px either side of the spawn's x is left clear
// from the beach up through the forest, so the player walks straight up to
// the volcano's foot. Nothing is within 120 px of the spawn. The first
// placement of each prop carries the sign with its word; the repeats are
// silent. Ids of the trees are tree-2-N because tree-1 is on island 5
// (the ids keep the old island numbers; they only need to be unique)

