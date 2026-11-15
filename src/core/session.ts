/**
 * Level session engine: a pure state machine stepped once per frame with the
 * current stick values. No timers of its own; `now` comes from the caller.
 */
import { zoneOf } from './axis'
import { timeoutMs, type ZoneLevel } from './levels'
import type { StickAxis, StickValues } from './radio'

/** "Get ready" pause before the first target. */
export const COUNTDOWN_MS = 1500
/** Pause between targets so the result registers before the next one appears. */
export const GAP_MS = 300

export interface ActiveTarget {
  axis: StickAxis
  count: number
  zone: number
  shownAt: number
  /** Zone the stick was in when the target appeared (to detect overshoot). */
  startZone: number
  /** When the current stay in the target zone began, if the stick is in it. */
  holdStart: number | null
  /** Went past the target at least once. */
  overshoot: boolean
}

export interface TargetResult {
  axis: StickAxis
  count: number
  zone: number
  hit: boolean
  /** Target shown → start of the successful hold. Null for a miss. */
  timeMs: number | null
  overshoot: boolean
}

export type Phase = 'countdown' | 'target' | 'gap' | 'done'

export interface SessionState {
  level: ZoneLevel
  phase: Phase
  phaseStart: number
  target: ActiveTarget | null
  results: TargetResult[]
}

export type Rng = () => number

export function startSession(level: ZoneLevel, now: number): SessionState {
  return { level, phase: 'countdown', phaseStart: now, target: null, results: [] }
}

/** Advance the session by one frame. Returns a new state (input is not modified). */
export function stepSession(s: SessionState, values: StickValues, now: number, rng: Rng = Math.random): SessionState {
  switch (s.phase) {
    case 'done':
      return s
    case 'countdown':
    case 'gap': {
      const wait = s.phase === 'countdown' ? COUNTDOWN_MS : GAP_MS
      if (now - s.phaseStart < wait) return s
      if (s.results.length >= s.level.targetCount) return { ...s, phase: 'done', phaseStart: now, target: null }
      const prev = s.results[s.results.length - 1]
      return { ...s, phase: 'target', phaseStart: now, target: pickTarget(s.level, values, now, rng, prev) }
    }
    case 'target':
      return stepTarget(s, values, now)
  }
}

function stepTarget(s: SessionState, values: StickValues, now: number): SessionState {
  const t = s.target!
  const current = zoneOf(values[t.axis], t.count)
  let { holdStart, overshoot } = t

  if (current === t.zone) {
    holdStart ??= now
    if (now - holdStart >= s.level.holdMs) {
      return finish(s, { ...t, holdStart, overshoot }, true, now)
    }
  } else {
    holdStart = null
    if (isPast(t.startZone, t.zone, current)) overshoot = true
  }

  // Time out only when not mid-hold, so a hold in progress can complete.
  if (holdStart === null && now - t.shownAt >= timeoutMs(s.level)) {
    return finish(s, { ...t, holdStart, overshoot }, false, now)
  }
  return { ...s, target: { ...t, holdStart, overshoot } }
}

function finish(s: SessionState, t: ActiveTarget, hit: boolean, now: number): SessionState {
  const result: TargetResult = {
    axis: t.axis,
    count: t.count,
    zone: t.zone,
    hit,
    timeMs: hit ? t.holdStart! - t.shownAt : null,
    overshoot: t.overshoot,
  }
  return { ...s, phase: 'gap', phaseStart: now, target: null, results: [...s.results, result] }
}

/** True if `current` lies on the far side of `target` from where the stick started. */
export function isPast(startZone: number, target: number, current: number): boolean {
  return (startZone - target) * (current - target) < 0
}

/**
 * Pick the next target: a random trained axis and a zone the stick is not
 * already in (so every target needs a real move), never the same as the last one.
 */
export function pickTarget(
  level: ZoneLevel,
  values: StickValues,
  now: number,
  rng: Rng,
  prev?: { axis: StickAxis; zone: number },
): ActiveTarget {
  const axes = Object.keys(level.zones) as StickAxis[]
  const options: { axis: StickAxis; zone: number }[] = []
  for (const axis of axes) {
    const count = level.zones[axis]!
    const here = zoneOf(values[axis], count)
    for (let zone = 0; zone < count; zone++) {
      if (zone === here) continue
      if (prev && prev.axis === axis && prev.zone === zone) continue
      options.push({ axis, zone })
    }
  }
  const pick = options[Math.min(options.length - 1, Math.floor(rng() * options.length))]!
  const count = level.zones[pick.axis]!
  return {
    axis: pick.axis,
    count,
    zone: pick.zone,
    shownAt: now,
    startZone: zoneOf(values[pick.axis], count),
    holdStart: null,
    overshoot: false,
  }
}
