# tiles

- **Path:** `src/components/Game/islands/tiles.tsx`
- **Topic:** islands
- **Purpose:** The tile path of a tile island (GitHub issue #6): drawing it, and the tap-to-walk / yes-no controls handed to GameScene.

## Constants

`TILE_W` / `TILE_H` (42 × 26 world px = the 8 × 5 art px files × ~5.2, 1.3x the sprite scale), `TILE_IMG`: `cleared` (green, `/img/tile_cleared.png`), `available` (red, the next tile to play, `/img/tile-available.png`), `uncleared` (gray, locked, `/img/tile_uncleared.png`). Clear animation timing: `POP_MS` 400, `GROW_MS` 700, `OPEN_MS` 400 (`ANIM_MS` total). Path color `#58544c`, 5 px wide (from `public/img/tile-path-ref.png`). `TAP_PAD` 16 world px of slack around a tile for taps.

## Functions

### `lastReachable(cleared)`

The furthest tile the player may walk to: the first uncleared one, or the last when all are cleared.

**Input:** `cleared: boolean[]` (one per tile, path order). **Output:** `number` (-1 for no tiles). **Side effects:** none.

### `standAt(tile)`

The player's center when standing on a tile (feet on the tile's center). **Input:** `FileTile`. **Output:** `{ x, y }`. **Side effects:** none.

### `TilePath({ tiles, cleared, anim? })`

Draws the path in world px at zIndex 0: a rotated bar from each tile's center to the next (solid once the tile it leaves is cleared, faint dashed before), then each tile's sprite (green cleared, red the first uncleared, gray locked). `anim` = a tile index playing its clear animation, in order: the tile pops green, the solid line grows over the dashed one, the next tile pops in red (CSS keyframes in a `<style>`).

**Output:** JSX. **Side effects:** none.

### `useTileWalk(tiles, cleared, onYes, seenKey)`

The tile controls. Keeps the tile the player stands on (starts on the first uncleared), the walk in progress, the tile being asked about, and the clear animation. When `cleared` holds a tile not in the played list (`localStorage['ikko-tiles-seen:' + seenKey]`), the newest such tile animates, the player is moved onto it (`moveRequest`), and the next tile can't be tapped until the animation ends. The list is rewritten to the cleared tiles each time.

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `tiles` | `FileTile[]` | the island's tiles, path order |
| `cleared` | `boolean[]` | per tile, its quest is done |
| `onYes` | `(tile: FileTile) => void` | called on はい |
| `seenKey` | `string` | names the played-animation list: `game-<island>`, `editor-<island>`, `mobdev-<island>-<ver>` |

**Output:** `{ spawn, sceneProps }`. `spawn` = `{ x, y }` to put on `bgProps` (GameScene's spawn). `sceneProps` = `{ onTap, walkPath, onArrive, renderWorld, moveRequest }` for `<GameScene>`:
- `onTap`: while asking, only はい / いいえ count (はい → `onYes`); otherwise a tap on a reachable tile walks there through every tile in between, a tap on the current tile asks again, locked tiles are ignored.
- `onArrive`: the walk ended, so the player is on the target tile and its yes / no shows.
- `renderWorld`: `TilePath` plus the yes / no `DialogBubble` over the player (はじめる？ / もういちど？ on a cleared tile).

**Side effects:** React state; reads / writes the played-animation list in localStorage.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| game | `src/components/Game/Scene/IslandScene.tsx` | tile mode: はい opens `/Game/<island>/<questId>` |
| island-editor | `src/components/IslandEditor/phoneView.tsx` | tile mode: はい marks the tile cleared locally |
| island-editor | `src/components/IslandEditor/canvas.tsx` | `TilePath`, `TILE_W`, `TILE_H` |
| island-editor | `src/components/IslandEditor/assetBox.tsx` | `TILE_IMG` |

## GameScene props it relies on (`Scene/gameScene.tsx`)

- `onTap?: (tap: SceneTap) => void`: tap mode. The stick and keys never move the player; a finger lifted where it went down (not mid-pinch) reports `{ x, y }` in world px and `choice` (the dialog choice under the finger, else null). NPC taps don't start talks in this mode.
- `walkPath?: WalkPath` (`{ points, key }`): the tick walks the points in turn at `WALK_SPEED` (sprint speed), ignoring solids and the wave; a new key restarts it.
- `onArrive?: () => void`: called when the last point is reached.
