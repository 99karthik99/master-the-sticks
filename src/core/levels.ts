/** Level definitions. See docs/levels-draft.md for the full ladder. */
import type { StickAxis } from './radio'

/** "Move one axis into a zone and hold it" levels (Stages 1–2). */
export interface ZoneLevel {
  id: string
  stage: number
  title: string
  /** Axes trained in this level and their zone counts. Mixed levels list several. */
  zones: Partial<Record<StickAxis, number>>
  /** How long the stick must stay in the target zone. */
  holdMs: number
  /** Median time-to-target needed to pass. */
  limitMs: number
  targetCount: number
}

export const TARGETS_PER_LEVEL = 20

/** A target not reached within this time is a miss: 3× the limit, at least 3 s. */
export const timeoutMs = (level: ZoneLevel) => Math.max(3000, 3 * level.limitMs)

const level = (
  id: string,
  title: string,
  zones: ZoneLevel['zones'],
  holdMs: number,
  limitMs: number,
): ZoneLevel => ({ id, stage: Number(id.split('.')[0]), title, zones, holdMs, limitMs, targetCount: TARGETS_PER_LEVEL })

export const STAGES: { stage: number; title: string; blurb: string }[] = [
  { stage: 1, title: 'Find the zones', blurb: 'One axis at a time, coarse zones, generous timing.' },
  { stage: 2, title: 'Finer zones', blurb: 'More zones, longer holds, tighter limits.' },
]

export const LEVELS: readonly ZoneLevel[] = [
  level('1.1', 'Throttle', { throttle: 4 }, 300, 2500),
  level('1.2', 'Yaw', { yaw: 3 }, 300, 2500),
  level('1.3', 'Pitch', { pitch: 3 }, 300, 2500),
  level('1.4', 'Roll', { roll: 3 }, 300, 2500),
  level('1.5', 'All four, mixed', { throttle: 4, yaw: 3, pitch: 3, roll: 3 }, 300, 2000),
  level('2.1', 'Throttle, 6 zones', { throttle: 6 }, 400, 2000),
  level('2.2', 'Yaw, pitch, roll — 5 zones', { yaw: 5, pitch: 5, roll: 5 }, 400, 2000),
  level('2.3', 'Throttle, 8 zones', { throttle: 8 }, 500, 1800),
  level('2.4', 'Yaw, pitch, roll — 7 zones', { yaw: 7, pitch: 7, roll: 7 }, 500, 1800),
  level('2.5', 'All four, fine', { throttle: 8, yaw: 7, pitch: 7, roll: 7 }, 500, 1500),
]

export const levelById = (id: string) => LEVELS.find((l) => l.id === id)

export const nextLevel = (id: string) => {
  const i = LEVELS.findIndex((l) => l.id === id)
  return i >= 0 ? LEVELS[i + 1] : undefined
}
