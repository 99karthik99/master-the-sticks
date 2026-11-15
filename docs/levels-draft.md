# Level Ladder — v0.2

> Status: **stage list agreed** (`qa-claude-asks.md` Q7–Q8). All 9 stages are
> in v1. The numbers are still starting guesses; we'll tune them in play-testing.

## 1. Terms

- **Axis:** throttle (T), yaw (Y), pitch (P), roll (R). Mode 2: left stick = Y (x) + T (y), right stick = R (x) + P (y).
- **Zones:** an axis's range split into equal bands.
  - **Throttle** doesn't spring back, so any zone count works (we start at 4).
  - **Yaw, pitch and roll** spring back to center, so they use **odd** counts (3, 5, 7…). That way there's always a true center zone, and finding center is a skill in itself.
- **Target:** "move axis X into zone N". It's shown highlighted on the radio drawing.
- **Hit:** the stick enters the target zone and **stays there for the hold time**.
  - Leaving the zone resets the hold timer.
  - A target not hit within its **timeout** (3× the level's time limit, minimum 3 s) is a **miss**.
- **Time-to-target:** from the target appearing until the hold *starts*. The hold time itself isn't counted.
- **Overshoot:** the stick goes past the target zone before the hold completes. It's recorded and shown with a red flash, but it doesn't fail the target.
- **Isolation band:** in isolation levels, the axes you're *not* meant to move must stay within ±X% of where they started. Leaving it is an **isolation miss**.

## 2. Pass rules and stars

- Each level has **20 targets** in random order, with no target repeated twice in a row.
- **Accuracy** = hits ÷ targets.
- **Pass (★):** accuracy ≥ 90% **and** median time-to-target ≤ the level's time limit.
- **★★:** pass + median ≤ 0.8 × limit.
- **★★★:** pass + median ≤ 0.6 × limit + accuracy ≥ 97%.
- Passing a level unlocks the next one. The first level of the next stage needs the previous stage's levels passed.

## 3. The ladder

Columns: **Zones** = zones per axis · **Hold** = hold time · **Limit** = median time-to-target needed to pass.

### Stage 1 — Find the zones (single axis, coarse)
Learn where each axis's ranges are. Generous timings.

| Level | Axis | Zones | Hold | Limit |
|---|---|---|---|---|
| 1.1 | Throttle | 4 | 300 ms | 2.5 s |
| 1.2 | Yaw | 3 | 300 ms | 2.5 s |
| 1.3 | Pitch | 3 | 300 ms | 2.5 s |
| 1.4 | Roll | 3 | 300 ms | 2.5 s |
| 1.5 | Mixed (any of the 4) | 4 / 3 | 300 ms | 2.0 s |

### Stage 2 — Finer zones (single axis)
More zones, tighter limits, longer holds.

| Level | Axis | Zones | Hold | Limit |
|---|---|---|---|---|
| 2.1 | Throttle | 6 | 400 ms | 2.0 s |
| 2.2 | Yaw / Pitch / Roll (mixed) | 5 | 400 ms | 2.0 s |
| 2.3 | Throttle | 8 | 500 ms | 1.8 s |
| 2.4 | Yaw / Pitch / Roll (mixed) | 7 | 500 ms | 1.8 s |
| 2.5 | All 4 (mixed) | 8 / 7 | 500 ms | 1.5 s |

### Stage 3 — Throttle finesse (FPV)
In FPV, most flying happens in the low-to-mid throttle range, and small throttle changes matter a lot. These levels use a **target band** anywhere between 20% and 70% throttle, instead of fixed zones.

| Level | Task | Band width | Hold | Limit |
|---|---|---|---|---|
| 3.1 | Hit a throttle band | 10% | 1.0 s | 2.0 s |
| 3.2 | Hit a throttle band | 6% | 1.5 s | 2.0 s |
| 3.3 | **Hover hold:** stay in a ±3% band | 6% | 3.0 s | 2.0 s |
| 3.4 | **Throttle steps:** band moves up/down by small steps; follow it | 6% | 0.8 s | 1.2 s |

### Stage 4 — One stick, two axes
The target is a cell in a grid on one gimbal, so both axes on that stick must be right at the same time. Diagonals count.

| Level | Stick | Grid | Hold | Limit |
|---|---|---|---|---|
| 4.1 | Right (roll + pitch) | 3×3 | 400 ms | 2.0 s |
| 4.2 | Left (yaw + throttle) | 3×3 | 400 ms | 2.0 s |
| 4.3 | Right | 5×5 | 500 ms | 1.8 s |
| 4.4 | Left | 5×5 | 500 ms | 1.8 s |
| 4.5 | Either stick (mixed) | 5×5 | 500 ms | 1.5 s |

### Stage 5 — Isolation
Move one axis while keeping the others still. Beginners commonly drift throttle while yawing, or mix pitch into roll. Untouched axes must stay inside the isolation band.

| Level | Move | Keep still | Zones | Isolation band | Limit |
|---|---|---|---|---|---|
| 5.1 | Yaw | Throttle | 5 | ±8% | 2.0 s |
| 5.2 | Roll | Pitch | 5 | ±8% | 2.0 s |
| 5.3 | Pitch | Roll | 5 | ±8% | 2.0 s |
| 5.4 | Any one axis | All 3 others | 7 | ±5% | 1.8 s |

### Stage 6 — Both sticks together
Two targets at once, one per stick. Both must be held together.

| Level | Left stick | Right stick | Hold | Limit |
|---|---|---|---|---|
| 6.1 | Throttle 4 zones | Roll or pitch, 3 zones | 500 ms | 2.5 s |
| 6.2 | Throttle band 10% | Right 3×3 grid | 700 ms | 2.5 s |
| 6.3 | Left 3×3 grid | Right 3×3 grid | 700 ms | 2.5 s |
| 6.4 | Throttle band 6% | Right 5×5 grid | 1.0 s | 2.0 s |

### Stage 7 — Flick and return (flips and rolls)
FPV flips and rolls are fast full-stick movements followed by a return to center. Task: reach the far zone (outer 10%) and be back in the center zone within a time window.

| Level | Task | Window |
|---|---|---|
| 7.1 | Roll flick (left or right) | 800 ms |
| 7.2 | Pitch flick (forward or back) | 800 ms |
| 7.3 | Flick + keep throttle in a 10% band | 700 ms |
| 7.4 | Mixed flicks, tighter window | 500 ms |

### Stage 8 — Tracking
A target moves along a path and the stick must follow it. Scored on the average distance from the target, instead of hits.

| Level | Path |
|---|---|
| 8.1 | Throttle follows a slow wave |
| 8.2 | Right stick traces a circle |
| 8.3 | Right stick traces a figure-8 |
| 8.4 | Throttle wave + right stick circle together |

### Stage 9 — Speed test (always available after Stage 2)
60 seconds of random targets drawn from the stages you've unlocked. Score = targets per minute × accuracy. Keeps a personal best. This is the "WPM test" equivalent.

## 4. Not decided yet
- Whether the time limit should depend on how far the stick must travel. A target far from where the stick is now takes longer than a nearby one. This could come later.
- Sound feedback (tick on hit, buzz on miss).
