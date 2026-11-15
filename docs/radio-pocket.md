# RadioMaster Pocket — USB Joystick notes

Measured with `tools/stick-check.html` in Chrome on macOS (2026-11-15).

- **USB id:** `Radiomaster Pocket Joystick (Vendor: 1209 Product: 4f54)`
- **Gamepad mapping:** none, so it's a generic joystick and we must map axes ourselves.
- **Axes:** 8, **Buttons:** 24.

| Axis | Stick (Mode 2) | Direction | Notes |
|---|---|---|---|
| 0 | Roll (right stick X) | right = +1 | min −0.976, center +0.021 |
| 1 | Pitch (right stick Y) | up = +1 (invert for screen) | min −0.991 |
| 2 | Throttle (left stick Y) | up = +1 (invert for screen) | doesn't spring back; use min/max only |
| 3 | Yaw (left stick X) | right = +1 | max 0.996 |
| 4–7 | Channels 5–8 (switches/aux) | — | not used yet |

The order matches the AETR channel order: aileron, elevator, throttle, rudder.

**Takeaways:**
- Ranges and centers are slightly off, so a per-user calibration step is required.
- **Update rate:** at least 60 Hz while moving (peak hit the 60 Hz screen-refresh cap of the measurement). The ~21 Hz average only reflects idle time. See `qa-claude-asks.md` Q10.
