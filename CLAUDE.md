# Master the Sticks

Desktop app that teaches RC radio stick control (FPV, RadioMaster Pocket first)
through a typing-tutor-style level ladder.

## Working docs
- `requirement.md`: product requirements (source of truth).
- `docs/levels-draft.md`: the level ladder.
- `docs/radio-pocket.md`: measured USB joystick layout of the Pocket.
- `docs/decisions.md`: decision log. Add a row for every product/tech decision.
- `qa-claude-asks.md` / `qa-human-asks.md`: Q&A with the owner (git-ignored).
  - Claude asks in `qa-claude-asks.md`, then folds answers into the docs and marks them `[RESOLVED]`.
  - Owner asks in `qa-human-asks.md`. Only the owner marks those resolved.

## Stack
Electron + electron-vite + React + TypeScript; Vitest for tests.
The radio is read in the renderer through the browser Gamepad API (no native code).

## Layout
- `src/main/`: Electron main process (window only).
- `src/renderer/`: React UI.
  - `radio/`: `useGamepad` (reads the first gamepad every animation frame) and profile storage.
  - `setup/`: the setup wizard (mode, axis mapping, range, center).
  - `levels/`: level select. `play/`: play screen and results.
  - `live/`: "Free play" view (radio drawing, per-axis bars, zone preview, redo setup).
  - `components/radio/`: the Pocket line drawing, split by section (`Outline`, `Gimbal`,
    `CenterControls`, `LowerControls`). All positions live in `geometry.ts`, measured from
    the Pocket front-view diagram (mapping documented at the top of that file).
  - `compare.tsx` + `compare.html` (dev only, not in the app build): overlays a reference
    image on the drawing. Open `http://localhost:5173/compare.html?ref=<image URL>`.
- `src/core/`: pure game logic (calibration, zones, scoring). No React/DOM/Electron/Node
  imports; every module has a `*.test.ts`. Imported in the UI as `@core/...`.
  - `radio.ts` (profile, layout per mode, `readSticks`), `mapping.ts` (detect the moved axis),
    `calibration.ts` (ranges, steadiness, `buildProfile`), `axis.ts` (normalize, zones),
    `levels.ts` (level definitions), `session.ts` (per-frame level engine),
    `scoring.ts` (score, stars, progress, unlocking).
- `build/icon.svg`: app icon source (the Pocket gimbal). `npm run icon` regenerates
  `build/icon.png` and `build/icon.icns` via `tools/build-icon.cjs`.
- `tools/stick-check.html`: standalone page to inspect a radio's axes in Chrome.

## Commands
- `npm run dev`: run the app with hot reload.
- `npm test`: unit tests.
- `npm run typecheck`: type-check everything.
- `npm run build`: production build into `out/`.

## Testing UI without the radio
In a browser at the dev server URL, replace `navigator.getGamepads` with a function
returning a mock `{ id, connected: true, axes: [...] }` and change its `axes` to simulate sticks.

