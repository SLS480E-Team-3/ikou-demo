# Header / footer strip on phones (issue #13), 2026-10-26

## Done
- Added `/test` (`src/app/test/page.tsx`, DEV): bare `<GameScene />` on a magenta page, with a readout of standalone / safe-area / inner vs screen size.
- Found: the user's "phone" screenshots came from a desktop phone-frame tool (`screen: 1512x982`), whose fake status bar uses the manifest theme_color. Not a container bug.
- In the iPhone 17 simulator as a Home Screen app, /test is full screen (874pt, safe 62/34). The only top strip is iOS 26's blurred band, tinted with the html/body background.
- Quest scenes (dodge, matching, inBetween, bridge) now pass `tintEdges={BUBBLE_BG}`; `GameScene`'s `tintEdges` takes `boolean | string`, where a string is the color used while the screen's top row is above the world.
- Checked in the simulator: the matching quest's status bar band is the tatami color.

## Not verified
- The zoomed-out case (cream above the room) during a run: the simulator pinch didn't register, so play a run on the phone to check.

## Next
- Close #13 once checked on a real phone; nothing committed yet.
