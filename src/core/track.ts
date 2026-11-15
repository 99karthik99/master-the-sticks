/**
 * Tracking session (Stage 8): a target moves along a path for a fixed time and
 * the sticks follow it. Pure state machine, stepped once per frame.
 */
import type { StickAxis, StickValues } from './radio'

export type Path = (tSec: number) => number

export interface TrackConfig {
  /** Target position over time, per followed axis (normalized -1..1). */
  paths: Partial<Record<StickAxis, Path>>
  durationMs: number
  /** On target when every followed axis is within this distance (normalized units). */
  tolerance: number
}

/** Shows the start position so the user can line up before the clock starts. */
export const TRACK_COUNTDOWN_MS = 2500

export interface TrackState {
  config: TrackConfig
  phase: 'countdown' | 'running' | 'done'
  phaseStart: number
  lastNow: number
  /** Time spent running / on target, ms. */
  elapsed: number
  onTarget: number
  /** Time-weighted sum of the worst axis error (for the average). */
  errorSum: number
}

export function startTrack(config: TrackConfig, now: number): TrackState {
  return { config, phase: 'countdown', phaseStart: now, lastNow: now, elapsed: 0, onTarget: 0, errorSum: 0 }
}

/** Where the target is at `now`. During the countdown it sits at the path start. */
export function trackTargets(s: TrackState, now: number): Partial<Record<StickAxis, number>> {
  const t = s.phase === 'running' ? (now - s.phaseStart) / 1000 : 0
  const out: Partial<Record<StickAxis, number>> = {}
  for (const [axis, path] of Object.entries(s.config.paths) as [StickAxis, Path][]) out[axis] = path(t)
  return out
}

/** Worst axis distance from the target right now. */
export function trackError(s: TrackState, values: StickValues, now: number): number {
  const targets = trackTargets(s, now)
  let worst = 0
  for (const [axis, v] of Object.entries(targets) as [StickAxis, number][]) worst = Math.max(worst, Math.abs(values[axis] - v))
  return worst
}

export function stepTrack(s: TrackState, values: StickValues, now: number): TrackState {
  if (s.phase === 'done') return s
  if (s.phase === 'countdown') {
    return now - s.phaseStart >= TRACK_COUNTDOWN_MS ? { ...s, phase: 'running', phaseStart: now, lastNow: now } : s
  }
  const dt = Math.max(0, Math.min(100, now - s.lastNow)) // ignore stalls (window hidden etc.)
  const err = trackError(s, values, now)
  const next: TrackState = {
    ...s,
    lastNow: now,
    elapsed: s.elapsed + dt,
    onTarget: s.onTarget + (err <= s.config.tolerance ? dt : 0),
    errorSum: s.errorSum + err * dt,
  }
  return now - s.phaseStart >= s.config.durationMs ? { ...next, phase: 'done', phaseStart: now } : next
}

// Paths (t in seconds). Amplitudes stay inside the stick range with room to spare.
const TAU = Math.PI * 2
/** Slow throttle wave around low-mid throttle (the FPV cruising range). */
export const throttleWave: Path = (t) => -0.25 + 0.45 * Math.sin((TAU * t) / 7)
export const circleX: Path = (t) => 0.6 * Math.sin((TAU * t) / 6)
export const circleY: Path = (t) => 0.6 * Math.cos((TAU * t) / 6)
export const eightX: Path = (t) => 0.6 * Math.sin((TAU * t) / 8)
export const eightY: Path = (t) => 0.5 * Math.sin((2 * TAU * t) / 8)
