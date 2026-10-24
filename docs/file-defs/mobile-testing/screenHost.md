# screenHost

- **Path:** `src/app/MobDev/[screen]/screenHost.tsx`
- **Topic:** mobile-testing
- **Purpose:** Client host that lazy-loads one screen and renders it full-screen with the URL settings.

## Functions

### `ScreenHost` (default export)

Renders `SCREENS[screen]` in a `position: fixed; inset: 0` wrapper (exactly the visible screen, no vh units; scrolls if the content is taller).

**Input**

| Name | Type | Meaning |
| --- | --- | --- |
| `screen` | `ScreenType` | Which screen to show |

Reads `?island` (int, default 1), `?ver` (saved island version for GameScene; missing = newest, 0 = the code's map) and `?sens` (number or `undefined`) via `useSearchParams`.

**Output:** JSX: the chosen screen with `island`, `ver`, `sensitivity`, `onLeave`.

**Side effects:** fetches the screen's JS chunk on first render; `onLeave` does `router.push('/MobDev')`.

**Used in**

| Topic | File | Where |
| --- | --- | --- |
| mobile-testing | `src/app/MobDev/[screen]/page.tsx` | `MobDevScreen` (inside `<Suspense>`) |

### `SCREENS` (module const)

`Record<ScreenType, ComponentType<ScreenProps>>`; each value is `next/dynamic(..., { ssr: false })`. Quest and island entries adapt `ScreenProps` to the component's own props; form pages take none. `QuestMatching` (issue #8) loads `MatchingQuestIsland` the same way as `QuestDodge`; `QuestInBetween` (issue #12) loads `InBetweenQuestIsland` the same way; `QuestBridge` loads `BridgeQuestIsland` with `?group=` like `QuestMatching`.

### `Tint`

`({ color }) => <style>`: sets `html, body` background to `color` while the screen is mounted, so Safari's status-bar strip and the area under its URL bar match the scene. Quests use `BUBBLE_BG` (loaded inside the quest chunk). GameScene instead passes `tint` to IslandPreview, which paints the current island's color (or the quest cream) so it follows prev / next.

### `toNum`

`(v: string | null) => number | undefined`: query value to number; empty or not a number gives `undefined`. Used only in `ScreenHost`.
