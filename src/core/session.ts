/**
 * Target session engine: a pure state machine stepped once per frame with the
 * current stick values. Used by every "reach and hold" level and the speed test.
 */
import type { StickAxis, StickMode, StickValues } from './radio'
import { inRange, isPastRange, type Rng, type TargetGen, type TargetSpec } from './targets'

/** "Get ready" pause before the first target. */
export const COUNTDOWN_MS = 1500
/** Pause between targets so the result registers before the next one appears. */
export const GAP_MS = 300
/** How far an axis must move from its start before a flick counts as started. */
const MOVE_EPS = 0.1

export interface SessionConfig {
  gen: TargetGen
  mode: StickMode
  /** Stop after this many targets… */
  targetCount?: number
  /** …or after this long (speed test). */
  durationMs?: number
  /** A target not completed in this time is a miss. */
  timeoutMs: number
}

export interface ActiveTarget {
  spec: TargetSpec
  shownAt: number
  /** Stick values when the target appeared. */
  start: StickValues
  stepIndex: number
  /** When the current stay inside the step began, if inside. */
  holdStart: number | null
  /** When the first step's successful hold began. */
  reachedAt: number | null
  /** First frame a wanted axis moved away from its start (flick timing). */
  movedAt: number | null
  /** Went past the target at least once. */
  overshoot: boolean
}

export type MissReason = 'timeout' | 'keep' | 'slow'

export interface TargetResult {
  key: string
  label: string
  hit: boolean
  /** Reach time (shown → hold starts), or flick duration (first move → back in center). */
  timeMs: number | null
  overshoot: boolean
  reason?: MissReason
}

export type Phase = 'countdown' | 'target' | 'gap' | 'done'

export interface SessionState {
  config: SessionConfig
  phase: Phase
  phaseStart: number
  /** When targets began (end of countdown); used for duration-limited sessions. */
  startedAt: number | null
  target: ActiveTarget | null
  results: TargetResult[]
  lastSpec?: TargetSpec
}

export function startSession(config: SessionConfig, now: number): SessionState {
  return { config, phase: 'countdown', phaseStart: now, startedAt: null, target: null, results: [] }
}

/** Advance the session by one frame. Returns a new state (input is not modified). */
export function stepSession(s: SessionState, values: StickValues, now: number, rng: Rng = Math.random): SessionState {
  if (s.phase === 'done') return s
  const { durationMs, targetCount } = s.config
  if (durationMs !== undefined && s.startedAt !== null && now - s.startedAt >= durationMs) {
    return { ...s, phase: 'done', phaseStart: now, target: null }
  }
  if (s.phase === 'countdown' || s.phase === 'gap') {
    if (now - s.phaseStart < (s.phase === 'countdown' ? COUNTDOWN_MS : GAP_MS)) return s
    if (targetCount !== undefined && s.results.length >= targetCount) return { ...s, phase: 'done', phaseStart: now, target: null }
    const spec = s.config.gen({ values, mode: s.config.mode, rng, prev: s.lastSpec })
    return {
      ...s,
      phase: 'target',
      phaseStart: now,
      startedAt: s.startedAt ?? now,
      lastSpec: spec,
      target: { spec, shownAt: now, start: values, stepIndex: 0, holdStart: null, reachedAt: null, movedAt: null, overshoot: false },
    }
  }
  return stepTarget(s, values, now)
}

function stepTarget(s: SessionState, values: StickValues, now: number): SessionState {
  const t = s.target!
  const { spec } = t
  const step = spec.steps[t.stepIndex]!
  let { holdStart, reachedAt, movedAt, overshoot, stepIndex } = t

  if (spec.keep.some((r) => !inRange(values, r))) return finish(s, t, false, null, now, 'keep')

  if (movedAt === null && spec.steps[0]!.want.some((r) => Math.abs(values[r.axis] - t.start[r.axis]) >= MOVE_EPS)) movedAt = now

  if (step.want.every((r) => inRange(values, r))) {
    holdStart ??= now
    if (now - holdStart >= step.holdMs) {
      if (stepIndex === 0) reachedAt = holdStart
      if (stepIndex === spec.steps.length - 1) {
        const next = { ...t, holdStart, reachedAt, movedAt, overshoot }
        if (spec.windowMs !== undefined) {
          const duration = now - (movedAt ?? t.shownAt)
          return finish(s, next, duration <= spec.windowMs, duration, now, duration <= spec.windowMs ? undefined : 'slow')
        }
        return finish(s, next, true, reachedAt! - t.shownAt, now)
      }
      stepIndex++
      holdStart = null
    }
  } else {
    holdStart = null
    if (stepIndex === 0 && step.want.some((r) => isPastRange(t.start[r.axis], r, values[r.axis]))) overshoot = true
  }

  // A flick that takes longer than its window fails as soon as the window runs out.
  if (spec.windowMs !== undefined && movedAt !== null && now - movedAt > spec.windowMs) {
    return finish(s, { ...t, movedAt, overshoot }, false, now - movedAt, now, 'slow')
  }
  // Time out only when not mid-hold, so a hold in progress can complete.
  if (holdStart === null && now - t.shownAt >= s.config.timeoutMs) {
    return finish(s, { ...t, overshoot }, false, null, now, 'timeout')
  }
  return { ...s, target: { ...t, holdStart, reachedAt, movedAt, overshoot, stepIndex } }
}

function finish(s: SessionState, t: ActiveTarget, hit: boolean, timeMs: number | null, now: number, reason?: MissReason): SessionState {
  const result: TargetResult = {
    key: t.spec.key,
    label: t.spec.label,
    hit,
    timeMs: hit ? timeMs : null,
    overshoot: t.overshoot,
    ...(reason ? { reason } : {}),
  }
  return { ...s, phase: 'gap', phaseStart: now, target: null, results: [...s.results, result] }
}

/** Axes of the current step that are past their range right now (for the red overshoot colour). */
export function pastAxes(t: ActiveTarget, values: StickValues): StickAxis[] {
  if (t.stepIndex !== 0) return []
  return t.spec.steps[0]!.want.filter((r) => isPastRange(t.start[r.axis], r, values[r.axis])).map((r) => r.axis)
}
