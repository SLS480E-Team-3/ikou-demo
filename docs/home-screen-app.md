# Home Screen app

**Decision (2026-10-23):** the game is played as a Home Screen web app, launched from its icon, not in a Safari tab.

**Why:** in Safari, the status bar and the URL bar can't be hidden or made see-through by a page. iOS 26 Safari even freezes their color once the player starts moving. Launched from the Home Screen, the game is full screen: no URL bar, and the scene draws behind the clock and Dynamic Island.

## Install on an iPhone

1. Open the site in Safari (the deployed Vercel URL).
2. Tap ⋯ (or Share) → **View More** → **Add to Home Screen**, with **Open as Web App** on.
3. Open it from the **Ikko** icon (the pixel cat).

The icon opens the page it was added from (the manifest has no `start_url`): add it on `/` for the game, or on `/MobDev/GameScene` for the test screen.

## What makes it work

| File | What it does |
| --- | --- |
| `src/app/manifest.ts` | `display: standalone`, icons, splash color |
| `src/app/layout.tsx` | `metadata.appleWebApp` (capable, `black-translucent` status bar), explicit `apple-mobile-web-app-capable`, `viewportFit: 'cover'` |
| `src/app/apple-icon.png`, `public/icons/` | app icon (180, 192, 512, maskable 512), made from `public/img/nyanko.png` |

## Rules for new screens

- **Design for the full screen.** Game screens fill `100lvh` and draw under the status bar and the home indicator.
- **Keep UI inside the safe area.** Anything pinned to the top uses `calc(var(--safe-top) + …)`, and anything pinned to the bottom uses `calc(var(--safe-bottom) + …)` (`--safe-*` are in `globals.css`; they're 0 on desktop, so desktop is unchanged).
- **No `position: fixed` element touching the screen's top or bottom edge on game screens.** In Safari it freezes the bar color (see `GameScene`'s `tintEdges`). Use `absolute` inside the screen's box instead.
- **Test it as a Home Screen app**, in the iOS simulator or on a phone, not only in a Safari tab or the desktop browser.
- Safari tabs still work (the bars are tinted with the ground at the top edge), but they aren't the target.
