/**
 * Target model shared by every "reach and hold" level (Stages 1–7 and the speed test).
 *
 * A target is a list of steps. Each step lists axis ranges that must ALL be
 * held at once for `holdMs`. Most targets have one step; a flick has two
 * (far edge, then back to center). `keep` ranges must hold for the whole
 * target (isolation): leaving one is a miss.
 */
import { zoneOf, zoneRange } from './axis'
import { STICK_AXES, stickLayout, type StickAxis, type StickMode, type StickValues } from './radio'

export interface AxisRange {
  axis: StickAxis
  lo: number
  hi: number
}

export interface Step {
  want: AxisRange[]
  holdMs: number
}

export interface TargetSpec {
  /** Identifies the target, to avoid repeating the same one twice in a row. */
  key: string
  label: string
  steps: Step[]
  keep: AxisRange[]
  /** Flick: max time from first movement to finishing the last step. */
  windowMs?: number
  /** Zone stripes to draw, per axis. */
  divisions: Partial<Record<StickAxis, number>>
  /** Generator-specific memory (e.g. last band center for "follow the steps"). */
  meta?: { center?: number; parts?: TargetSpec[] }
}

export type Rng = () => number

export interface GenContext {
  values: StickValues
  mode: StickMode
  rng: Rng
  prev?: TargetSpec
}

export type TargetGen = (ctx: GenContext) => TargetSpec

export const inRange = (values: StickValues, r: AxisRange) => values[r.axis] >= r.lo && values[r.axis] <= r.hi

/** True if the value has gone past the range, on the side away from where it started. */
export const isPastRange = (start: number, r: { lo: number; hi: number }, v: number) =>
  (start < r.lo && v > r.hi) || (start > r.hi && v < r.lo)

const LABEL: Record<StickAxis, string> = { throttle: 'Throttle', yaw: 'Yaw', pitch: 'Pitch', roll: 'Roll' }
/** Words for each direction of the centered axes: [negative, positive]. */
const DIRECTION: Record<Exclude<StickAxis, 'throttle'>, [string, string]> = {
  roll: ['left', 'right'],
  yaw: ['left', 'right'],
  pitch: ['back', 'forward'],
}

/**
 * Target label for zone `zone` of `n`:
 * - throttle as a percent range: "Throttle → 20–40%"
 * - centered axes as direction + deflection from center: "Roll → right 60–100%",
 *   "Pitch → center (±20%)", or just "Yaw → left" when there are only 3 zones.
 */
export function zoneLabel(axis: StickAxis, zone: number, n: number): string {
  const r = (v: number) => Math.round(v)
  if (axis === 'throttle') return `Throttle → ${r((zone * 100) / n)}–${r(((zone + 1) * 100) / n)}%`
  const { lo, hi } = zoneRange(zone, n)
  const [neg, pos] = DIRECTION[axis]
  if (lo < 0 && hi > 0) return n === 3 ? `${LABEL[axis]} → center` : `${LABEL[axis]} → center (±${r(hi * 100)}%)`
  const dir = hi <= 0 ? neg : pos
  if (n === 3) return `${LABEL[axis]} → ${dir}`
  const from = Math.min(Math.abs(lo), Math.abs(hi))
  const to = Math.max(Math.abs(lo), Math.abs(hi))
  return `${LABEL[axis]} → ${dir} ${r(from * 100)}–${r(to * 100)}%`
}

const pick = <T,>(xs: readonly T[], rng: Rng): T => xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))]!
const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v))

/** Throttle percent (0–100) ↔ normalized value (-1..1). */
export const throttlePct = (v: number) => (v + 1) * 50
export const fromPct = (p: number) => p / 50 - 1

/** The stick that does not carry throttle (right stick in Mode 2, left in Mode 1). */
export function otherSide(mode: StickMode): 'left' | 'right' {
  const { left } = stickLayout(mode)
  return left.x === 'throttle' || left.y === 'throttle' ? 'right' : 'left'
}

/** The two axes of the non-throttle stick, each with `n` zones. */
export const otherStickZones = (n: number) => (mode: StickMode) => {
  const { x, y } = stickLayout(mode)[otherSide(mode)]
  return { [x]: n, [y]: n } as Partial<Record<StickAxis, number>>
}

// ---------------------------------------------------------------------------
// Generators

/** One axis into one of its zones. Mixed levels list several axes. */
export function zones(counts: Partial<Record<StickAxis, number>> | ((mode: StickMode) => Partial<Record<StickAxis, number>>), holdMs: number): TargetGen {
  return ({ values, mode, rng, prev }) => {
    const c = typeof counts === 'function' ? counts(mode) : counts
    const options: { axis: StickAxis; zone: number; n: number }[] = []
    for (const axis of Object.keys(c) as StickAxis[]) {
      const n = c[axis]!
      const here = zoneOf(values[axis], n)
      for (let zone = 0; zone < n; zone++) {
        if (zone !== here && prev?.key !== `zone:${axis}:${zone}/${n}`) options.push({ axis, zone, n })
      }
    }
    const { axis, zone, n } = pick(options, rng)
    return {
      key: `zone:${axis}:${zone}/${n}`,
      label: zoneLabel(axis, zone, n),
      steps: [{ want: [{ axis, ...zoneRange(zone, n) }], holdMs }],
      keep: [],
      divisions: { [axis]: n },
    }
  }
}

export interface BandOptions {
  /** Band width in throttle percent. */
  width: number
  /** Band must lie within this throttle range (percent). */
  min: number
  max: number
  holdMs: number
  /** "Follow the steps": next band center moves this many percent from the last. */
  step?: [number, number]
  /** Label prefix, e.g. "Hover". */
  name?: string
}

/** A throttle band (e.g. 6% wide somewhere in 20–70%), never one the stick is already in. */
export function band(o: BandOptions): TargetGen {
  return ({ values, rng, prev }) => {
    const here = throttlePct(values.throttle)
    const lo = o.min + o.width / 2
    const hi = o.max - o.width / 2
    let center = lo
    for (let tries = 0; tries < 40; tries++) {
      const last = prev?.meta?.center
      if (o.step && last !== undefined) {
        const d = o.step[0] + rng() * (o.step[1] - o.step[0])
        const dir = last + d > hi ? -1 : last - d < lo ? 1 : rng() < 0.5 ? -1 : 1
        center = Math.round(Math.min(hi, Math.max(lo, last + dir * d)))
      } else {
        center = Math.round(lo + rng() * (hi - lo))
      }
      if (Math.abs(here - center) > o.width / 2) break
    }
    const a = center - o.width / 2
    const b = center + o.width / 2
    return {
      key: `band:${center}`,
      label: `${o.name ?? 'Throttle'} → ${Math.round(a)}–${Math.round(b)}%`,
      steps: [{ want: [{ axis: 'throttle', lo: fromPct(a), hi: fromPct(b) }], holdMs: o.holdMs }],
      keep: [],
      divisions: {},
      meta: { center },
    }
  }
}

export type Side = 'left' | 'right' | 'either' | 'other'

/** A cell in an n×n grid on one stick: both of its axes must be right at once. */
export function grid(side: Side, n: number, holdMs: number): TargetGen {
  return ({ values, mode, rng, prev }) => {
    const layout = stickLayout(mode)
    const s = side === 'either' ? pick(['left', 'right'] as const, rng) : side === 'other' ? otherSide(mode) : side
    const { x, y } = layout[s]
    const hx = zoneOf(values[x], n)
    const hy = zoneOf(values[y], n)
    const options: [number, number][] = []
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === hx && j === hy) continue
        if (prev?.key === `grid:${s}:${i},${j}/${n}`) continue
        options.push([i, j])
      }
    const [i, j] = pick(options, rng)
    return {
      key: `grid:${s}:${i},${j}/${n}`,
      label: `${s === 'left' ? 'Left' : 'Right'} stick → the blue cell`,
      steps: [{ want: [{ axis: x, ...zoneRange(i, n) }, { axis: y, ...zoneRange(j, n) }], holdMs }],
      keep: [],
      divisions: { [x]: n, [y]: n },
    }
  }
}

/** Move one axis to a zone while the listed other axes stay within ±bandPct of where they were. */
export function isolation(move: readonly StickAxis[], keep: readonly StickAxis[] | 'others', n: number, bandPct: number, holdMs: number): TargetGen {
  const inner = zones(Object.fromEntries(move.map((a) => [a, n])), holdMs)
  return (ctx) => {
    const t = inner(ctx)
    const axis = t.steps[0]!.want[0]!.axis
    const keepAxes = keep === 'others' ? STICK_AXES.filter((a) => a !== axis) : keep.filter((a) => a !== axis)
    const b = bandPct / 50
    const keepRanges = keepAxes.map((a) => ({ axis: a, lo: clamp(ctx.values[a] - b), hi: clamp(ctx.values[a] + b) }))
    return {
      ...t,
      key: `iso:${t.key}`,
      label: `${t.label} · keep ${keepAxes.map((a) => LABEL[a].toLowerCase()).join(', ')} still`,
      keep: keepRanges,
    }
  }
}

/** Two targets at once (one per stick): all ranges held together, for the longer hold. */
export function dual(a: TargetGen, b: TargetGen): TargetGen {
  return (ctx) => {
    const [pa, pb] = ctx.prev?.meta?.parts ?? []
    const ta = a({ ...ctx, prev: pa })
    const tb = b({ ...ctx, prev: pb })
    return {
      key: `${ta.key}|${tb.key}`,
      label: `${ta.label}  +  ${tb.label}`,
      steps: [{ want: [...ta.steps[0]!.want, ...tb.steps[0]!.want], holdMs: Math.max(ta.steps[0]!.holdMs, tb.steps[0]!.holdMs) }],
      keep: [...ta.keep, ...tb.keep],
      divisions: { ...ta.divisions, ...tb.divisions },
      meta: { parts: [ta, tb] },
    }
  }
}

/** Far edge (outer 10% of the range) */
const FAR = 0.8
/** Center zone for the return. */
const CENTER = 0.2

const FLICK_DIR: Record<StickAxis, [string, string]> = {
  roll: ['left', 'right'],
  pitch: ['back', 'forward'],
  yaw: ['left', 'right'],
  throttle: ['down', 'up'],
}

/** Full deflection to the far edge and back to center, within `windowMs`. */
export function flick(axes: readonly StickAxis[], windowMs: number, keepThrottleBandPct?: number): TargetGen {
  return ({ values, rng, prev }) => {
    const options: { axis: StickAxis; dir: 1 | -1 }[] = []
    for (const axis of axes)
      for (const dir of [1, -1] as const) if (prev?.key !== `flick:${axis}:${dir}`) options.push({ axis, dir })
    const { axis, dir } = pick(options, rng)
    const far = dir > 0 ? { lo: FAR, hi: 1 } : { lo: -1, hi: -FAR }
    const keep: AxisRange[] = []
    if (keepThrottleBandPct) {
      const b = keepThrottleBandPct / 100 // half of the band, in normalized units (100% = 2.0)
      keep.push({ axis: 'throttle', lo: clamp(values.throttle - b), hi: clamp(values.throttle + b) })
    }
    return {
      key: `flick:${axis}:${dir}`,
      label: `${LABEL[axis]} flick → ${FLICK_DIR[axis][dir > 0 ? 1 : 0]} and back${keep.length ? ' · keep throttle steady' : ''}`,
      steps: [
        { want: [{ axis, ...far }], holdMs: 0 },
        { want: [{ axis, lo: -CENTER, hi: CENTER }], holdMs: 0 },
      ],
      keep,
      windowMs,
      divisions: {},
    }
  }
}

/** Pick from several generators at random (speed test). */
export function mix(gens: readonly TargetGen[]): TargetGen {
  return (ctx) => pick(gens, ctx.rng)(ctx)
}
