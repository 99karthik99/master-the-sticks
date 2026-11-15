import { describe, expect, it } from 'vitest'
import { LEVELS, levelById, timeoutMs, type TargetLevel } from './levels'
import type { StickValues } from './radio'
import { COUNTDOWN_MS, startSession, stepSession, type SessionConfig, type SessionState } from './session'
import { flick, isolation, zones, type TargetGen } from './targets'

const rest: StickValues = { throttle: -1, yaw: 0, pitch: 0, roll: 0 }
const mid = (z: number, n: number) => -1 + (2 * z + 1) / n
const cfg = (gen: TargetGen, over: Partial<SessionConfig> = {}): SessionConfig => ({ gen, mode: 2, targetCount: 20, timeoutMs: 7500, ...over })

function firstTarget(config: SessionConfig, values = rest) {
  let s = startSession(config, 0)
  s = stepSession(s, values, COUNTDOWN_MS - 1, () => 0)
  expect(s.phase).toBe('countdown')
  s = stepSession(s, values, COUNTDOWN_MS, () => 0)
  expect(s.phase).toBe('target')
  return s
}
const T0 = COUNTDOWN_MS

describe('reach and hold', () => {
  const config = cfg(zones({ throttle: 4 }, 300))

  it('hits after the hold, timed to the start of the hold', () => {
    let s = firstTarget(config) // rng 0 → zone 1 (zone 0 is where the stick is)
    const v = { ...rest, throttle: mid(1, 4) }
    s = stepSession(s, v, T0 + 800)
    s = stepSession(s, v, T0 + 1099)
    expect(s.phase).toBe('target')
    s = stepSession(s, v, T0 + 1100)
    expect(s.results[0]).toMatchObject({ hit: true, timeMs: 800, overshoot: false })
  })

  it('resets the hold when the stick leaves', () => {
    let s = firstTarget(config)
    const v = { ...rest, throttle: mid(1, 4) }
    s = stepSession(s, v, T0 + 500)
    s = stepSession(s, rest, T0 + 600)
    s = stepSession(s, v, T0 + 700)
    s = stepSession(s, v, T0 + 999)
    expect(s.phase).toBe('target')
    s = stepSession(s, v, T0 + 1000)
    expect(s.results[0]).toMatchObject({ hit: true, timeMs: 700 })
  })

  it('flags overshoot and times out', () => {
    let s = firstTarget(config)
    s = stepSession(s, { ...rest, throttle: mid(3, 4) }, T0 + 100)
    expect(s.target!.overshoot).toBe(true)
    s = stepSession(s, rest, T0 + 7500)
    expect(s.results[0]).toMatchObject({ hit: false, reason: 'timeout', overshoot: true })
  })

  it('finishes after targetCount', () => {
    let s: SessionState = firstTarget(config)
    let now = T0
    while (s.phase !== 'done' && now < 1e6) {
      now += 10
      const r = s.target?.spec.steps[0]!.want[0]
      s = stepSession(s, r ? { ...rest, [r.axis]: (r.lo + r.hi) / 2 } : rest, now)
    }
    expect(s.results).toHaveLength(20)
    expect(s.results.every((r) => r.hit)).toBe(true)
  })
})

describe('isolation', () => {
  it('misses as soon as a kept axis leaves its band', () => {
    let s = firstTarget(cfg(isolation(['yaw'], ['throttle'], 5, 8, 400)))
    s = stepSession(s, { ...rest, yaw: 0.5, throttle: -0.7 }, T0 + 200)
    expect(s.results[0]).toMatchObject({ hit: false, reason: 'keep' })
  })
})

describe('flick', () => {
  const config = cfg(flick(['roll'], 800)) // rng 0 → roll, right

  it('hits when out and back within the window, timed from first movement', () => {
    let s = firstTarget(config)
    s = stepSession(s, rest, T0 + 300) // reaction time, not counted
    s = stepSession(s, { ...rest, roll: 0.5 }, T0 + 350) // moved
    s = stepSession(s, { ...rest, roll: 0.95 }, T0 + 450) // far edge
    s = stepSession(s, { ...rest, roll: 0.1 }, T0 + 700) // back in center
    expect(s.results[0]).toMatchObject({ hit: true, timeMs: 350 })
  })

  it('misses as "slow" once the window runs out', () => {
    let s = firstTarget(config)
    s = stepSession(s, { ...rest, roll: 0.5 }, T0 + 100)
    s = stepSession(s, { ...rest, roll: 0.95 }, T0 + 400)
    s = stepSession(s, { ...rest, roll: 0.95 }, T0 + 901)
    expect(s.results[0]).toMatchObject({ hit: false, reason: 'slow' })
  })
})

describe('speed test (duration)', () => {
  it('ends when time is up, discarding the open target', () => {
    let s = firstTarget(cfg(zones({ throttle: 4 }, 300), { targetCount: undefined, durationMs: 60000 }))
    s = stepSession(s, rest, T0 + 60000)
    expect(s.phase).toBe('done')
    expect(s.results).toHaveLength(0)
  })
})

describe('LEVELS', () => {
  it('have unique ids, odd zone counts on centered axes, sane limits', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
    for (const l of LEVELS.filter((x): x is TargetLevel => x.kind === 'target')) {
      expect(timeoutMs(l.limitMs)).toBeGreaterThanOrEqual(3000)
      const t = l.gen({ values: rest, mode: 2, rng: Math.random })
      for (const [axis, n] of Object.entries(t.divisions)) if (axis !== 'throttle') expect(n! % 2).toBe(1)
    }
    expect(levelById('9.1')?.unlockAfter).toBe('2.5')
  })

  it('every target level generates targets in both modes without throwing', () => {
    for (const l of LEVELS.filter((x): x is TargetLevel => x.kind === 'target'))
      for (const mode of [1, 2] as const)
        for (let i = 0; i < 30; i++) expect(l.gen({ values: rest, mode, rng: Math.random }).steps.length).toBeGreaterThan(0)
  })
})
