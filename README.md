# Master the Sticks

Learn your RC radio's sticks the way you learn typing: short drills that build
precision and speed, level by level. Built for FPV pilots, starting with the
RadioMaster Pocket (any EdgeTX radio in USB Joystick mode should work).

## Install (macOS, Apple Silicon)

1. Build the installer: `npm install` then `npm run dist:mac`.
2. Open `release/Master-the-Sticks-<version>-arm64.dmg` and drag **Master the Sticks** into **Applications**.
3. First launch: the app is not notarized by Apple yet. If macOS says it can't
   verify the developer, open **System Settings → Privacy & Security** and click
   **Open Anyway** next to Master the Sticks.

## Use

1. Connect the radio by USB and choose **USB Joystick (HID)** on it.
2. Move a stick so the app sees it, then follow the one-time setup
   (stick mode, map sticks, full range, center).
3. Pick a level. Pass levels to unlock the next ones; the speed test opens after Stage 2.

## Develop

```bash
npm install
npm run dev        # run with hot reload
npm test           # unit tests
npm run typecheck
```

See `CLAUDE.md` for the project layout and `docs/` for requirements, the level ladder and decisions.
