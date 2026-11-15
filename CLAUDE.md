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
- `src/core/`: pure game logic (calibration, zones, scoring). No React/DOM/Electron/Node
  imports; every module has a `*.test.ts`. Imported in the UI as `@core/...`.
- `tools/stick-check.html`: standalone page to inspect a radio's axes in Chrome.

## Commands
- `npm run dev`: run the app with hot reload.
- `npm test`: unit tests.
- `npm run typecheck`: type-check everything.
- `npm run build`: production build into `out/`.
