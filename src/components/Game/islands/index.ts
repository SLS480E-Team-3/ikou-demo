import type { PlacedObject } from "../Object/gameObject"
import { ISLAND_1, ISLAND_2, ISLAND_3, ISLAND_4, ISLAND_5 } from "./islands" // imports: **ISLAND_1** -> **ISLAND_1–5**, mechanism: islands 2–5 are back, as ikko-vision.pdf lays them out // imports: **ISLAND_1, 2, 3, 5** -> **ISLAND_1**, mechanism: the demo ships island 1 only

export const ISLAND_MAPS: Record<number, PlacedObject[]> = {
    1: ISLAND_1,
    2: ISLAND_2,
    3: ISLAND_3,
    4: ISLAND_4,
    5: ISLAND_5,
}
// islandId (islands.id in the db) -> that island's map. An island with no
// entry has no objects yet; IslandScene falls back to an empty list
