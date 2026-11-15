/** Axis mapping: work out which raw axis the user just moved. */

export interface AxisMove {
  index: number
  /** Current minus baseline. Positive means the raw value went up. */
  delta: number
}

/**
 * Find the single axis that moved furthest from `baseline`.
 * Returns null if nothing moved past `threshold`, or if two axes moved by a
 * similar amount (e.g. a diagonal push), since we can't tell which one was meant.
 */
export function detectMovedAxis(
  baseline: readonly number[],
  current: readonly number[],
  exclude: readonly number[] = [],
  threshold = 0.5,
): AxisMove | null {
  let best: AxisMove | null = null
  let second = 0
  for (let i = 0; i < current.length; i++) {
    if (exclude.includes(i)) continue
    const delta = (current[i] ?? 0) - (baseline[i] ?? 0)
    const size = Math.abs(delta)
    if (!best || size > Math.abs(best.delta)) {
      if (best) second = Math.max(second, Math.abs(best.delta))
      best = { index: i, delta }
    } else {
      second = Math.max(second, size)
    }
  }
  if (!best || Math.abs(best.delta) < threshold) return null
  if (second > Math.abs(best.delta) * 0.6) return null
  return best
}
