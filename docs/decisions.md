# Decision log

One line per decision, newest last. Details live in `requirement.md`, `docs/` and the Q&A files.

| # | Date | Decision | Reason | Source |
|---|------|----------|--------|--------|
| D1 | 2026-11-15 | Audience is FPV drone pilots | Owner's focus; shapes levels (fine throttle, flicks) | qa-claude-asks Q1 |
| D2 | 2026-11-15 | Mode 2 first; Mode 1 via axis mapping in setup | Mode 2 is most common; mapping makes Mode 1 cheap | qa-claude-asks Q2 |
| D3 | 2026-11-15 | macOS first, cross-platform stack | Owner's machine; Windows/Linux later without a rewrite | qa-claude-asks Q3 |
| D4 | 2026-11-15 | Fixed level ladder; per-target stats still recorded | Simpler to build and test; stats keep an adaptive mode cheap later | qa-claude-asks Q4 |
| D5 | 2026-11-15 | Pass = ≥90% accuracy + median time-to-target under the limit; 1–3 stars | Agreed rule | qa-claude-asks Q5 |
| D6 | 2026-11-15 | Look: white background, black line drawing of the Pocket, live sticks, colour-coded zones | Owner's design | qa-claude-asks Q6 |
| D7 | 2026-11-15 | Electron + TypeScript + React (electron-vite, Vitest); radio read via the Gamepad API | Chromium reads generic HID joysticks on all platforms with no native code | qa-human-asks Q1 |
| D8 | 2026-11-15 | All 9 stages in v1, including flick-and-return and tracking | Owner wants them; both are core FPV skills | qa-claude-asks Q7–Q8 |
| D9 | 2026-11-15 | Per-user calibration step (min/center/max per axis); centered axes scale each half separately | Real Pocket readings stop short of ±1 and rest slightly off 0 | qa-claude-asks Q9 |
| D10 | 2026-11-15 | Read input once per animation frame (~60 Hz) | Pocket updates at least as fast as the 60 Hz screen limit; 16 ms timing is fine for every level | qa-claude-asks Q10 |
| D11 | 2026-11-15 | Pure game logic in `src/core` with no UI/Electron imports | Unit-testable and keeps the rules separate from drawing | Project setup |
| D12 | 2026-11-15 | Setup flow: choose mode → push each axis up/right to map it (direction sets inversion) → sweep full range → let go to capture center | Works for any radio and channel order; no hand-entered numbers | Milestone 1 |
| D13 | 2026-11-15 | Radio profile saved per gamepad id in the app's localStorage | Survives restarts with no file handling; a different radio gets its own setup | Milestone 1 |
| D14 | 2026-11-15 | Radio drawn as one hand-made SVG (simplified Pocket front view); zone bands drawn inside the gimbal of the trained axis, outer bands stretched to the gimbal edge | Crisp at any size, easy to colour per zone; band edges line up exactly with where the stick tip is drawn | Milestone 2 |
| D15 | 2026-11-15 | Zone colours: alternating light greys, darker grey = stick's current zone, blue = target, green = stick in target, red = overshoot | Matches the agreed look (Q6); "current zone" grey helps beginners see where they are | Milestone 2 |
| D16 | 2026-11-15 | Level engine is a pure state machine (`src/core/session.ts`) stepped once per frame; scoring and progress are pure functions | Fully unit-testable without a radio or UI; the same engine serves every zone level | Milestone 3 |
| D17 | 2026-11-15 | A new target is never the zone the stick is already in, nor the previous target | Every target needs a real move, so times aren't flattered by free hits | Milestone 3 |
| D18 | 2026-11-15 | Target band turns red while the stick is past it; green fill grows across the band during the hold | Immediate, readable feedback for overshoot and hold progress (Q6 design) | Milestone 3 |
| D19 | 2026-11-15 | Milestone 3 ships Stages 1–2 (10 levels); later stages need band, 2D-grid, isolation, flick and tracking logic | Stages 1–2 share the zone engine; the rest come in later milestones | Milestone 3 |
| D20 | 2026-11-15 | One target model for Stages 1–7 and the speed test: steps of axis ranges held together, optional "keep" ranges (isolation) and a window (flicks); generators per target kind | One engine, one drawing guide, one scoring path for seven kinds of level | Milestone 4 |
| D21 | 2026-11-15 | Tracking (Stage 8) has its own engine, scored on time on target (80 / 88 / 95% for 1–3 stars) instead of average distance | "Stay on the ring" is easier to read than a distance number; distance is still shown | Milestone 4 |
| D22 | 2026-11-15 | Flick window timed from first stick movement, not from the prompt | Measures the flick itself; reaction time would make 500 ms windows near impossible | Milestone 4 |
| D23 | 2026-11-15 | Throttle targets shown as percent ranges in round steps (20% in Stage 1, 10% in Stage 2) | Pilots think of throttle in percent; owner request | Owner request |
| D24 | 2026-11-15 | Yaw/pitch/roll targets shown as direction + deflection % ("Roll → right 60–100%", "Pitch → center (±20%)"; plain left/center/right with 3 zones) | Matches how pilots think about stick throw; no counting zones in your head | Owner request |
| D25 | 2026-11-15 | Light/dark theme toggle (top right); first run follows the system setting, then the choice is remembered. All colours are CSS tokens switched by `data-theme` on <html> | One stylesheet, both themes; the line-art drawing inverts cleanly | Owner request |
| D26 | 2026-11-15 | Sound effects synthesized with Web Audio (go blip, hit tick, miss buzz, pass/fail chime) with an on/off toggle next to the theme toggle | No audio files to ship or license; tiny and instant | Owner request |
