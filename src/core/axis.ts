/** Raw-to-normalized axis handling. Pure functions, no DOM. */

/** Per-axis calibration recorded during setup. Values are raw gamepad readings. */
export interface AxisCalibration {
  min: number
  max: number
  /** Rest position. Omit for throttle, which doesn't spring back. */
  center?: number
  /** Flip direction so that "up" / "right" is always positive. */
  inverted?: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Map a raw reading to -1..1 using the calibration.
 * With a center, each half is scaled separately, so an off-center rest point
 * still reads as exactly 0 and both ends still reach ±1.
 */
export function normalizeAxis(raw: number, cal: AxisCalibration): number {
  let v: number
  if (cal.center === undefined) {
    const span = cal.max - cal.min
    v = span <= 0 ? 0 : ((raw - cal.min) / span) * 2 - 1
  } else if (raw >= cal.center) {
    const span = cal.max - cal.center
    v = span <= 0 ? 0 : (raw - cal.center) / span
  } else {
    const span = cal.center - cal.min
    v = span <= 0 ? 0 : (raw - cal.center) / span
  }
  v = clamp(v, -1, 1)
  return cal.inverted ? -v : v
}

/**
 * Which of `count` equal zones a normalized value (-1..1) falls in.
 * Zone 0 is the low end (-1), zone count-1 the high end (+1).
 */
export function zoneOf(value: number, count: number): number {
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid zone count: ${count}`)
  const t = (clamp(value, -1, 1) + 1) / 2 // 0..1
  return Math.min(count - 1, Math.floor(t * count))
}

/** The value range covered by zone `z` of `count` equal zones. */
export function zoneRange(z: number, count: number): { lo: number; hi: number } {
  return { lo: -1 + (2 * z) / count, hi: -1 + (2 * (z + 1)) / count }
}
