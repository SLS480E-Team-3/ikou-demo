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

const SPAWN_CLEAR = 120
const scatter = (prefix: string, defs: string[], rect: { dx: number, dy: number, w: number, h: number }, count: number, seed: number, scale = 0.12): PlacedObject[] => {
    let s = seed
    const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
    }
    const out: PlacedObject[] = []
    for (let tries = 0; out.length < count && tries < count * 20; tries++) {
        const dx = Math.round(rect.dx + rand() * rect.w)
        const dy = Math.round(rect.dy + rand() * rect.h)
        if (Math.hypot(dx, dy) < SPAWN_CLEAR) continue
        out.push(place(`${prefix}-${out.length + 1}`, defs[out.length % defs.length], dx, dy, scale))
    }
    return out
}
// copied from ../ikko: scatters `count` decorations over a rectangle (dx, dy
// = its top-left from the spawn, like place()). The positions come from a
// small seeded generator (a linear congruential one), not Math.random, so
// the layout is the same on every load and on the server and the client.
// The defs are used in turn; a spot closer than SPAWN_CLEAR to the spawn is
// drawn again. A different seed gives a different layout

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


export const ISLAND_2: PlacedObject[] = [
    // hill (world y 0-600, dy -1000..-400): the far (あ) landmarks
    place('tree-k-1', 'tree', 0, -700, 0.8, { kind: 'sign', text: 'き (ki) = tree' }),
    place('tree-k-2', 'tree', -460, -820, 0.6),
    place('tree-k-3', 'tree', 440, -760, 0.6),
    // meadow (world y 600-1600, dy -400..600), the spawn
    place('apple-tree-k-1', 'apple-tree', 240, -60, 0.5, { kind: 'sign', text: 'りんごのき (ringo no ki) = apple tree' }),
    place('rock-k-1', 'rock', -300, -260, 0.3, { kind: 'sign', text: 'いわ (iwa) = rock' }),
    place('mushroom-k-1', 'mushroom', -380, 240, 0.15, { kind: 'sign', text: 'きのこ (kinoko) = mushroom' }),
    place('stump-k-1', 'stump', 360, 380, 0.3, { kind: 'sign', text: 'きりかぶ (kirikabu) = tree stump' }),
    // ground plants
    ...scatter('hill-k-plant', ['fern', 'grass-tuft', 'clover', 'small-bush'], { dx: -660, dy: -960, w: 1320, h: 520 }, 6, 77),
    ...scatter('meadow-k-plant', ['grass-tuft', 'clover', 'fern', 'small-bush'], { dx: -660, dy: -360, w: 1320, h: 920 }, 10, 88),
    ...scatter('beach-k-plant', ['seashell', 'starfish', 'seashell', 'starfish'], { dx: -660, dy: 640, w: 1320, h: 20 }, 3, 99),
]
// island 2's map, the こそあど meadow (docs/scenes/kosoado-meadow.md). The
// vision wants it "very open and grassy" so the player can tell what is
// near them (こ), near the listener (そ) and far from both (あ): only four
// signed props stand in the meadow, spread at different distances from the
// spawn, and three trees mark the far hill straight up from the spawn. The
// column 100 px either side of the spawn's x stays clear up to the hill

export const ISLAND_3: PlacedObject[] = [
    // forest (world y 0-800, dy -1000..-200)
    place('tree-3-1', 'tree', -520, -300, 0.6, { kind: 'sign', text: 'き (ki) = tree' }),
    place('tree-3-2', 'tree', -300, -480, 0.6),
    place('tree-3-3', 'tree', 250, -330, 0.6),
    place('tree-3-4', 'tree', 480, -560, 0.6),
    place('tree-3-5', 'tree', -580, -820, 0.6),
    place('tree-3-6', 'tree', 320, -850, 0.6),
    place('pine-tree-1', 'pine-tree', -200, -640, 0.6, { kind: 'sign', text: 'まつ (matsu) = pine tree' }),
    place('pine-tree-2', 'pine-tree', 180, -560, 0.6),
    place('pine-tree-3', 'pine-tree', 600, -760, 0.6),
    place('pine-tree-4', 'pine-tree', -420, -400, 0.6),
    place('stump-1', 'stump', 400, -240, 0.3, { kind: 'sign', text: 'きりかぶ (kirikabu) = tree stump' }),
    place('stump-2', 'stump', -620, -560, 0.3),
    // clearing (world y 800-1600, dy -200..600), the spawn
    place('cabin-1', 'cabin', -380, 200, 1, { kind: 'sign', text: 'いえ (ie) = house' }),
    place('woodpile-1', 'woodpile', -200, 230, 0.3, { kind: 'sign', text: 'まき (maki) = firewood' }),
    place('woodpile-2', 'woodpile', -560, 320, 0.3),
    place('axe-1', 'axe', -130, 270, 0.15, { kind: 'sign', text: 'おの (ono) = axe' }),
    place('apple-tree-1', 'apple-tree', 330, 100, 0.5, { kind: 'sign', text: 'りんごのき (ringo no ki) = apple tree' }),
    place('apple-tree-2', 'apple-tree', 520, 420, 0.5),
    // bank (world y 1600-1700, dy 600..700)
    place('rock-3-1', 'rock', -450, 695, 0.3, { kind: 'sign', text: 'いわ (iwa) = rock' }),
    place('rock-3-2', 'rock', 300, 690, 0.3),
    place('rock-3-3', 'rock', 580, 695, 0.3),
    place('boat-1', 'boat', -220, 690, 0.3, { kind: 'sign', text: 'ふね (fune) = boat' }),
    // river (world y 1700-2000, dy 700..1000)
    place('bridge-1', 'bridge', 0, 850, 0.6, { kind: 'sign', text: 'はし (hashi) = bridge' }),
    place('fish-1', 'fish', 200, 726, 0.15, { kind: 'sign', text: 'さかな (sakana) = fish' }),
    place('fish-2', 'fish', -420, 900, 0.15),
    // ground plants
    ...scatter('forest-3-plant', ['fern', 'grass-tuft', 'clover', 'small-bush'], { dx: -660, dy: -960, w: 1320, h: 720 }, 8, 44),
    ...scatter('clearing-3-plant', ['fern', 'grass-tuft', 'clover', 'small-bush'], { dx: -660, dy: -160, w: 1320, h: 720 }, 8, 55),
    ...scatter('bank-3-plant', ['pebbles', 'driftwood', 'pebbles', 'driftwood'], { dx: -660, dy: 640, w: 1320, h: 20 }, 3, 66),
]
// island 3's map, the forest-island scene copied as-is from ../ikko's
// ISLAND_3 (docs/scenes/forest-island.md): the vision's "lot of trees"
// island for the particles に / で. Every sprite was already in public/img

export const ISLAND_4: PlacedObject[] = [
    // hill (world y 0-500, dy -1000..-500)
    place('pine-tree-4-1', 'pine-tree', -380, -640, 0.6, { kind: 'sign', text: 'まつ (matsu) = pine tree' }),
    place('tree-4-1', 'tree', 360, -700, 0.6),
    place('tree-4-2', 'tree', -560, -820, 0.6),
    // town (world y 500-1400, dy -500..400), the spawn
    place('cabin-4-1', 'cabin', -420, -240, 1, { kind: 'sign', text: 'いえ (ie) = house' }),
    place('cabin-4-2', 'cabin', 380, -260, 1),
    place('cabin-4-3', 'cabin', -480, 200, 1, { kind: 'sign', text: 'みせ (mise) = shop' }),
    place('cabin-4-4', 'cabin', 440, 180, 1),
    place('woodpile-4-1', 'woodpile', -220, 240, 0.3, { kind: 'sign', text: 'にもつ (nimotsu) = cargo' }),
    place('woodpile-4-2', 'woodpile', 230, 300, 0.3),
    // pier (world y 1400-1650, dy 400..650)
    place('fish-4-1', 'fish', -320, 520, 0.15, { kind: 'sign', text: 'さかな (sakana) = fish' }),
    place('fish-4-2', 'fish', -250, 560, 0.15),
    place('rock-4-1', 'rock', 560, 620, 0.3),
    // harbor (world y 1650-2000, dy 650..1000)
    place('boat-4-1', 'boat', -420, 820, 0.4, { kind: 'sign', text: 'ふね (fune) = boat' }),
    place('boat-4-2', 'boat', 160, 860, 0.4),
    place('boat-4-3', 'boat', 520, 780, 0.3),
    // ground plants
    ...scatter('hill-4-plant', ['fern', 'grass-tuft', 'clover', 'small-bush'], { dx: -660, dy: -960, w: 1320, h: 420 }, 5, 111),
    ...scatter('town-4-plant', ['pebbles', 'grass-tuft', 'pebbles', 'clover'], { dx: -660, dy: -440, w: 1320, h: 800 }, 6, 122),
    ...scatter('pier-4-plant', ['driftwood', 'pebbles', 'driftwood', 'seashell'], { dx: -660, dy: 440, w: 1320, h: 160 }, 3, 133),
]
// island 4's map, the port town (docs/scenes/port-town.md) the vision picks
// for は / が and basic phrases: houses and shops in two rows on the
// streets, cargo piles between them, a fish stall on the pier and boats in
// the harbor. The street 100 px either side of the spawn's x stays open from
// the pier up to the hill. All sprites are reused (cabin = house / shop,
// woodpile = cargo)

export const ISLAND_5: PlacedObject[] = [
    // volcano soil (world y 0-1700, dy -1000..700), the spawn
    place('volcano-5-1', 'volcano', 0, -620, 2, { kind: 'sign', text: 'かざん (kazan) = volcano' }),
    place('lava-lake-5-1', 'lava-lake', -420, -280, 0.4, { kind: 'sign', text: 'ようがん (yōgan) = lava' }),
    place('fire-5-1', 'fire', 260, -220, 0.2, { kind: 'sign', text: 'ひ (hi) = fire' }),
    place('fire-5-2', 'fire', -240, 320, 0.2),
    place('fire-5-3', 'fire', 480, -760, 0.2),
    place('rock-5-1', 'rock', 400, 260, 0.3, { kind: 'sign', text: 'いわ (iwa) = rock' }),
    place('rock-5-2', 'rock', -520, 520, 0.3),
    place('rock-5-3', 'rock', -560, -760, 0.3),
    // ground plants
    ...scatter('volcano-5-plant', ['dry-grass', 'dead-twig', 'ember', 'pebbles'], { dx: -660, dy: -960, w: 1320, h: 1600 }, 12, 144),
]
// island 5's map, the final-boss lair on ../ikko's volcano scene
// (docs/scenes/volcano.md): a placeholder until the boss is planned. The
// big volcano straight up from the spawn is where the boss will wait; lava,
// fire and rocks fill the rest, all reused sprites
