/** The level ladder. Source of the numbers: docs/levels-draft.md. */
import { band, dual, flick, grid, isolation, mix, otherStickZones, zones, type TargetGen } from './targets'
import { circleX, circleY, eightX, eightY, throttleWave, type TrackConfig } from './track'

interface LevelBase {
  id: string
  stage: number
  title: string
  /** One line for the level card. */
  summary: string
  /** Unlocked by passing this level instead of the one before it in the list. */
  unlockAfter?: string
}

/** Reach-and-hold targets (Stages 1–7). */
export interface TargetLevel extends LevelBase {
  kind: 'target'
  gen: TargetGen
  /** Median time needed to pass: reach time, or flick duration for flick levels. */
  limitMs: number
  targetCount: number
}

/** Follow a moving target (Stage 8). */
export interface TrackLevel extends LevelBase {
  kind: 'track'
  track: TrackConfig
}

/** Timed run of mixed targets from unlocked stages (Stage 9). */
export interface SpeedLevel extends LevelBase {
  kind: 'speed'
  durationMs: number
}

export type Level = TargetLevel | TrackLevel | SpeedLevel

export const TARGETS_PER_LEVEL = 20

/** A target not reached within this time is a miss: 3× the limit, at least 3 s. */
export const timeoutMs = (limitMs: number) => Math.max(3000, 3 * limitMs)

const s = (ms: number) => `${+(ms / 1000).toFixed(2)} s`

function target(id: string, title: string, gen: TargetGen, holdMs: number, limitMs: number, detail: string, targetCount = TARGETS_PER_LEVEL): TargetLevel {
  return {
    kind: 'target',
    id,
    stage: Number(id.split('.')[0]),
    title,
    summary: `${detail} · hold ${s(holdMs)} · under ${s(limitMs)}`,
    gen,
    limitMs,
    targetCount,
  }
}

function flickLevel(id: string, title: string, gen: TargetGen, windowMs: number): TargetLevel {
  return { kind: 'target', id, stage: 7, title, summary: `out and back within ${s(windowMs)}`, gen, limitMs: windowMs, targetCount: TARGETS_PER_LEVEL }
}

function trackLevel(id: string, title: string, paths: TrackConfig['paths']): TrackLevel {
  return { kind: 'track', id, stage: 8, title, summary: '30 s · stay on the moving target', track: { paths, durationMs: 30000, tolerance: 0.15 } }
}

export const STAGES: { stage: number; title: string; blurb: string }[] = [
  { stage: 1, title: 'Find the zones', blurb: 'One axis at a time, coarse zones, generous timing.' },
  { stage: 2, title: 'Finer zones', blurb: 'More zones, longer holds, tighter limits.' },
  { stage: 3, title: 'Throttle finesse', blurb: 'Narrow throttle bands in the 20–70% range where FPV flying happens.' },
  { stage: 4, title: 'One stick, two axes', blurb: 'Hit a cell in a grid: both axes of one stick at once.' },
  { stage: 5, title: 'Isolation', blurb: 'Move one axis while the others stay still.' },
  { stage: 6, title: 'Both sticks', blurb: 'A target on each stick, held together.' },
  { stage: 7, title: 'Flick and return', blurb: 'Full deflection and back to center, fast — like flips and rolls.' },
  { stage: 8, title: 'Tracking', blurb: 'Follow a moving target smoothly.' },
  { stage: 9, title: 'Speed test', blurb: '60 seconds of mixed targets. Your “words per minute” for sticks.' },
]

const CENTERED = ['yaw', 'pitch', 'roll'] as const

export const LEVELS: readonly Level[] = [
  // Stage 1 — Find the zones
  target('1.1', 'Throttle', zones({ throttle: 5 }, 300), 300, 2500, '20% steps'),
  target('1.2', 'Yaw', zones({ yaw: 3 }, 300), 300, 2500, '3 zones'),
  target('1.3', 'Pitch', zones({ pitch: 3 }, 300), 300, 2500, '3 zones'),
  target('1.4', 'Roll', zones({ roll: 3 }, 300), 300, 2500, '3 zones'),
  target('1.5', 'All four, mixed', zones({ throttle: 5, yaw: 3, pitch: 3, roll: 3 }, 300), 300, 2000, 'Throttle 20% · others 3 zones'),
  // Stage 2 — Finer zones
  target('2.1', 'Throttle, 10% steps', zones({ throttle: 10 }, 400), 400, 2000, '10% steps'),
  target('2.2', 'Yaw, pitch, roll — 5 zones', zones({ yaw: 5, pitch: 5, roll: 5 }, 400), 400, 2000, '5 zones'),
  target('2.3', 'Throttle, 10% steps, faster', zones({ throttle: 10 }, 500), 500, 1800, '10% steps'),
  target('2.4', 'Yaw, pitch, roll — 7 zones', zones({ yaw: 7, pitch: 7, roll: 7 }, 500), 500, 1800, '7 zones'),
  target('2.5', 'All four, fine', zones({ throttle: 10, yaw: 7, pitch: 7, roll: 7 }, 500), 500, 1500, 'Throttle 10% · others 7 zones'),
  // Stage 3 — Throttle finesse
  target('3.1', 'Throttle band', band({ width: 10, min: 20, max: 70, holdMs: 1000 }), 1000, 2000, '10% band'),
  target('3.2', 'Narrow band', band({ width: 6, min: 20, max: 70, holdMs: 1500 }), 1500, 2000, '6% band'),
  target('3.3', 'Hover hold', band({ width: 6, min: 30, max: 60, holdMs: 3000, name: 'Hover' }), 3000, 2000, '±3% for 3 s', 10),
  target('3.4', 'Throttle steps', band({ width: 6, min: 20, max: 70, holdMs: 800, step: [6, 15] }), 800, 1200, 'follow small steps'),
  // Stage 4 — One stick, two axes
  target('4.1', 'Right stick grid', grid('right', 3, 400), 400, 2000, '3×3'),
  target('4.2', 'Left stick grid', grid('left', 3, 400), 400, 2000, '3×3'),
  target('4.3', 'Right stick, fine grid', grid('right', 5, 500), 500, 1800, '5×5'),
  target('4.4', 'Left stick, fine grid', grid('left', 5, 500), 500, 1800, '5×5'),
  target('4.5', 'Either stick', grid('either', 5, 500), 500, 1500, '5×5'),
  // Stage 5 — Isolation
  target('5.1', 'Yaw without throttle drift', isolation(['yaw'], ['throttle'], 5, 8, 400), 400, 2000, '5 zones · throttle ±8%'),
  target('5.2', 'Roll without pitch', isolation(['roll'], ['pitch'], 5, 8, 400), 400, 2000, '5 zones · pitch ±8%'),
  target('5.3', 'Pitch without roll', isolation(['pitch'], ['roll'], 5, 8, 400), 400, 2000, '5 zones · roll ±8%'),
  target('5.4', 'One axis, others still', isolation(['throttle', ...CENTERED], 'others', 7, 5, 400), 400, 1800, '7 zones · others ±5%'),
  // Stage 6 — Both sticks
  target('6.1', 'Throttle + one axis', dual(zones({ throttle: 5 }, 500), zones(otherStickZones(3), 500)), 500, 2500, 'throttle 20% + 3 zones'),
  target('6.2', 'Throttle band + grid', dual(band({ width: 10, min: 20, max: 70, holdMs: 700 }), grid('other', 3, 700)), 700, 2500, '10% band + 3×3'),
  target('6.3', 'Two grids', dual(grid('left', 3, 700), grid('right', 3, 700)), 700, 2500, '3×3 + 3×3'),
  target('6.4', 'Narrow band + fine grid', dual(band({ width: 6, min: 20, max: 70, holdMs: 1000 }), grid('other', 5, 1000)), 1000, 2000, '6% band + 5×5'),
  // Stage 7 — Flick and return
  flickLevel('7.1', 'Roll flick', flick(['roll'], 800), 800),
  flickLevel('7.2', 'Pitch flick', flick(['pitch'], 800), 800),
  flickLevel('7.3', 'Flick, throttle steady', flick(['roll', 'pitch'], 700, 10), 700),
  flickLevel('7.4', 'Mixed flicks', flick(['roll', 'pitch', 'yaw'], 500), 500),
  // Stage 8 — Tracking
  trackLevel('8.1', 'Throttle wave', { throttle: throttleWave }),
  trackLevel('8.2', 'Circle', { roll: circleX, pitch: circleY }),
  trackLevel('8.3', 'Figure eight', { roll: eightX, pitch: eightY }),
  trackLevel('8.4', 'Wave + circle', { throttle: throttleWave, roll: circleX, pitch: circleY }),
  // Stage 9 — Speed test (open once Stage 2 is passed)
  { kind: 'speed', id: '9.1', stage: 9, title: 'Speed test', summary: '60 s · mixed targets from unlocked stages', durationMs: 60000, unlockAfter: '2.5' },
]

export const levelById = (id: string) => LEVELS.find((l) => l.id === id)

/** Next level in the ladder (the speed test is not "next" for anything). */
export const nextLevel = (id: string) => {
  const i = LEVELS.findIndex((l) => l.id === id)
  const next = i >= 0 ? LEVELS[i + 1] : undefined
  return next?.kind === 'speed' ? undefined : next
}

/** Speed test pool: the target levels of Stages 1–6 that are unlocked. */
export function speedTestGen(unlocked: (id: string) => boolean): TargetGen {
  const pool = LEVELS.filter((l): l is TargetLevel => l.kind === 'target' && l.stage <= 6 && unlocked(l.id) && l.id !== '3.3').map((l) => l.gen)
  return mix(pool)
}
