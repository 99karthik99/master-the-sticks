# Master the Sticks — Product Requirements (v0.3, draft)

## 1. Objective
A desktop app that teaches users to master the stick controls of an RC radio,
the same way a typing tutor teaches touch typing: through progressive levels
that build precision and speed.

- **Audience:** FPV drone pilots.
- **First supported radio:** RadioMaster Pocket (EdgeTX). Design should allow
  other radios later.
- **Platform:** macOS first. The tech stack should also support Windows/Linux
  without a rewrite.

## 2. Core Requirements

### R1. Radio detection
- The app detects the radio when it is connected to the computer
  (RadioMaster Pocket in USB Joystick / HID mode).

### R2. Stick input reading
- The app reads live input from all four stick axes:
  **throttle, yaw, pitch, roll**.
- The app has a **calibration step** that records each user's real min, center
  and max per axis. Real radios don't report a perfect ±1 or 0.
- **Stick mode:** Mode 2 (throttle on left stick) is the primary target.
  Support Mode 1 as well if it adds little complexity (e.g. through an
  axis-mapping step during setup).

### R2a. Radio setup
- First time a radio is connected, a short setup runs:
  1. Choose stick mode (Mode 2 default, Mode 1).
  2. Map the sticks: push each one fully up / right when asked.
  3. Move both sticks through their full range.
  4. Let go so the centers are recorded.
- The setup is saved per radio and can be redone at any time.

### R3. Levels
- Training is organized into a **fixed ladder** of levels: levels unlock in
  order.
- Each level gives the user tasks: move a given stick axis into a target range.

### R4. Level progression
- **Early levels:** broad movements. Each axis's range is split into a few
  ranges (e.g. 4), and the user moves the stick into the requested range.
  Applies to throttle, yaw, roll and pitch.
- **Higher levels:**
  - More ranges per axis → more precision required.
  - Speed is measured: how quickly the user reaches the target.

- The level list is in `docs/levels-draft.md`. All 9 stages are in v1:
  1. Coarse zones
  2. Finer zones
  3. Throttle finesse
  4. One stick, two axes
  5. Isolation
  6. Both sticks
  7. Flick and return
  8. Tracking
  9. Speed test

### R5. Passing a level
- Pass requires **≥ 90% accuracy** and a **median time-to-target** under the
  level's limit. The limit tightens as levels go up.
- Better performance earns **1–3 stars**.

### R6. Look and feel
- White background with a black line drawing of the **RadioMaster Pocket**
  (simplified, front view), with the sticks at center.
- Each stick sits in a square gimbal outline. The drawn sticks move live with
  the real sticks; yaw, pitch and roll spring back to center like the real ones.
- Zones for the active axis are drawn as bands inside its gimbal square:
  - Inactive bands: light grey.
  - Target band: blue.
  - Inside the target: green, filling up until the hold time is done.
  - Overshoot: brief red flash.
- A thin info strip above the radio shows level name, target count, timer and
  accuracy.

## 3. Out of Scope (for now)
- Radios other than the RadioMaster Pocket.
- Real flight simulation.
- Adaptive practice that targets weak spots (per-target stats are still
  recorded so this can be added later).

## 4. Open Questions
Tracked in `qa-claude-asks.md` (Claude → you) and `qa-human-asks.md` (you → Claude).
