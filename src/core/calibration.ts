/** Calibration helpers used by the setup flow. Raw gamepad units (-1..1). */
import { SPRING_CENTERED, STICK_AXES, type RadioProfile, type StickAxis, type StickMode } from './radio'

export interface Range {
  min: number
  max: number
}

/** Grow each axis's observed min/max with a new reading. */
export function extendRanges(prev: readonly Range[] | null, values: readonly number[]): Range[] {
  return values.map((v, i) => {
    const r = prev?.[i]
    return r ? { min: Math.min(r.min, v), max: Math.max(r.max, v) } : { min: v, max: v }
  })
}

/** How much of the raw -1..1 range (2 units) must be seen before we trust it. */
export const MIN_CALIBRATED_SPAN = 1.5

export function isRangeCovered(r: Range | undefined): boolean {
  return !!r && r.max - r.min >= MIN_CALIBRATED_SPAN
}

/** True if every listed axis stayed within `tolerance` across all frames. */
export function isSteady(
  frames: readonly (readonly number[])[],
  indices: readonly number[],
  tolerance = 0.03,
): boolean {
  if (frames.length === 0) return false
  return indices.every((i) => {
    let lo = Infinity
    let hi = -Infinity
    for (const f of frames) {
      const v = f[i] ?? 0
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
    }
    return hi - lo <= tolerance
  })
}

/** True if `value` sits in the middle `fraction` of the range (0.3 = middle 30%). */
export function isNearMiddle(value: number, r: Range, fraction = 0.3): boolean {
  const mid = (r.min + r.max) / 2
  return Math.abs(value - mid) <= ((r.max - r.min) / 2) * fraction
}

export interface AxisAssignment {
  index: number
  /** True if pushing up / right made the raw value go down. */
  inverted: boolean
}

/** Combine the setup steps' results into a profile. Throws if something is missing. */
export function buildProfile(
  gamepadId: string,
  mode: StickMode,
  assignments: Readonly<Record<StickAxis, AxisAssignment>>,
  ranges: readonly Range[],
  rest: readonly number[],
): RadioProfile {
  const axes = {} as RadioProfile['axes']
  for (const axis of STICK_AXES) {
    const { index, inverted } = assignments[axis]
    const r = ranges[index]
    if (!r || !isRangeCovered(r)) throw new Error(`${axis}: range not covered`)
    const center = SPRING_CENTERED[axis]
      ? Math.min(r.max, Math.max(r.min, rest[index] ?? 0))
      : undefined
    axes[axis] = {
      index,
      cal: { min: r.min, max: r.max, inverted, ...(center !== undefined ? { center } : {}) },
    }
  }
  return { version: 1, gamepadId, mode, axes }
}
