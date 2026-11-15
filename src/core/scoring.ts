/** Scoring and saved progress. Rules from docs/levels-draft.md §2. */
import { LEVELS, type Level, type SpeedLevel, type TargetLevel } from './levels'
import type { TargetResult } from './session'
import type { TrackState } from './track'

export const PASS_ACCURACY = 0.9
export const THREE_STAR_ACCURACY = 0.97
/** Tracking: share of time on target needed for 1 / 2 / 3 stars. */
export const TRACK_STARS = [0.8, 0.88, 0.95] as const

export type Stars = 0 | 1 | 2 | 3

export interface LevelScore {
  kind: Level['kind']
  passed: boolean
  stars: Stars
  /** Hits ÷ targets, or share of time on target for tracking. */
  accuracy: number
  hits?: number
  total?: number
  /** Median reach time / flick duration over hits. */
  medianMs?: number | null
  overshoots?: number
  /** Misses by cause. */
  keepMisses?: number
  slowMisses?: number
  /** Tracking: average distance from the target, in % of full stick travel. */
  meanErrorPct?: number
  /** Speed test: targets per minute × accuracy. */
  speed?: number
  hitsPerMinute?: number
}

export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

export function scoreTargets(level: TargetLevel, results: readonly TargetResult[]): LevelScore {
  const hits = results.filter((r) => r.hit)
  const total = results.length
  const accuracy = total ? hits.length / total : 0
  const medianMs = median(hits.map((r) => r.timeMs!))
  const passed = accuracy >= PASS_ACCURACY && medianMs !== null && medianMs <= level.limitMs
  let stars: Stars = 0
  if (passed) {
    stars = 1
    if (medianMs! <= 0.8 * level.limitMs) stars = 2
    if (medianMs! <= 0.6 * level.limitMs && accuracy >= THREE_STAR_ACCURACY) stars = 3
  }
  return {
    kind: 'target',
    passed,
    stars,
    accuracy,
    hits: hits.length,
    total,
    medianMs,
    overshoots: results.filter((r) => r.overshoot).length,
    keepMisses: results.filter((r) => r.reason === 'keep').length,
    slowMisses: results.filter((r) => r.reason === 'slow').length,
  }
}

export function scoreTrack(state: TrackState): LevelScore {
  const accuracy = state.elapsed ? state.onTarget / state.elapsed : 0
  const stars = TRACK_STARS.filter((t) => accuracy >= t).length as Stars
  return {
    kind: 'track',
    passed: stars >= 1,
    stars,
    accuracy,
    meanErrorPct: state.elapsed ? (state.errorSum / state.elapsed) * 50 : 100,
  }
}

export function scoreSpeed(level: SpeedLevel, results: readonly TargetResult[]): LevelScore {
  const hits = results.filter((r) => r.hit).length
  const accuracy = results.length ? hits / results.length : 0
  const hitsPerMinute = hits / (level.durationMs / 60000)
  return {
    kind: 'speed',
    passed: true,
    stars: 0,
    accuracy,
    hits,
    total: results.length,
    medianMs: median(results.filter((r) => r.hit).map((r) => r.timeMs!)),
    hitsPerMinute,
    speed: hitsPerMinute * accuracy,
  }
}

export interface LevelRecord {
  stars: Stars
  passed: boolean
  bestMedianMs: number | null
  bestAccuracy: number
  bestSpeed?: number
  plays: number
}

export type Progress = Record<string, LevelRecord>

/** Merge a finished attempt into progress, keeping the best of each figure. */
export function recordAttempt(progress: Progress, levelId: string, score: LevelScore): Progress {
  const prev = progress[levelId]
  const lower = (a: number | null | undefined, b: number | null | undefined) => (a == null ? (b ?? null) : b == null ? a : Math.min(a, b))
  const higher = (a: number | undefined, b: number | undefined) => (a === undefined ? b : b === undefined ? a : Math.max(a, b))
  const bestSpeed = higher(prev?.bestSpeed, score.speed)
  return {
    ...progress,
    [levelId]: {
      stars: Math.max(prev?.stars ?? 0, score.stars) as Stars,
      passed: (prev?.passed ?? false) || score.passed,
      bestMedianMs: score.passed ? lower(prev?.bestMedianMs, score.medianMs) : (prev?.bestMedianMs ?? null),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, score.accuracy),
      ...(bestSpeed !== undefined ? { bestSpeed } : {}),
      plays: (prev?.plays ?? 0) + 1,
    },
  }
}

const isPassed = (progress: Progress, id: string) => {
  const r = progress[id]
  return !!r && (r.passed || r.stars >= 1)
}

/** First level always open; otherwise the level before it (or `unlockAfter`) must be passed. */
export function isUnlocked(progress: Progress, levelId: string, levels: readonly Level[] = LEVELS): boolean {
  const i = levels.findIndex((l) => l.id === levelId)
  if (i < 0) return false
  const level = levels[i]!
  if (level.unlockAfter) return isPassed(progress, level.unlockAfter)
  if (i === 0) return true
  const prev = levels.slice(0, i).reverse().find((l) => l.kind !== 'speed')!
  return isPassed(progress, prev.id)
}
