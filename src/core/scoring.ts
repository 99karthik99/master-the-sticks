/** Level scoring and saved progress. Rules from docs/levels-draft.md §2. */
import { LEVELS, type ZoneLevel } from './levels'
import type { TargetResult } from './session'

export const PASS_ACCURACY = 0.9
export const THREE_STAR_ACCURACY = 0.97

export type Stars = 0 | 1 | 2 | 3

export interface LevelScore {
  hits: number
  total: number
  accuracy: number
  /** Median time-to-target over hits. Null if nothing was hit. */
  medianMs: number | null
  overshoots: number
  passed: boolean
  stars: Stars
}

export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

export function scoreLevel(level: ZoneLevel, results: readonly TargetResult[]): LevelScore {
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
  return { hits: hits.length, total, accuracy, medianMs, overshoots: results.filter((r) => r.overshoot).length, passed, stars }
}

export interface LevelRecord {
  stars: Stars
  bestMedianMs: number | null
  bestAccuracy: number
  plays: number
}

export type Progress = Record<string, LevelRecord>

/** Merge a finished attempt into progress, keeping the best of each figure. */
export function recordAttempt(progress: Progress, levelId: string, score: LevelScore): Progress {
  const prev = progress[levelId]
  const best = (a: number | null | undefined, b: number | null) =>
    a == null ? b : b == null ? a : Math.min(a, b)
  return {
    ...progress,
    [levelId]: {
      stars: Math.max(prev?.stars ?? 0, score.stars) as Stars,
      bestMedianMs: score.passed ? best(prev?.bestMedianMs, score.medianMs) : (prev?.bestMedianMs ?? null),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, score.accuracy),
      plays: (prev?.plays ?? 0) + 1,
    },
  }
}

/** The first level is always open; every other level needs the one before it passed. */
export function isUnlocked(progress: Progress, levelId: string, levels: readonly ZoneLevel[] = LEVELS): boolean {
  const i = levels.findIndex((l) => l.id === levelId)
  if (i <= 0) return i === 0
  return (progress[levels[i - 1]!.id]?.stars ?? 0) >= 1
}
