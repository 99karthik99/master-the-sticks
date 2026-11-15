import { describe, expect, it } from 'vitest'
import { LEVELS, levelById, timeoutMs } from './levels'
import { COUNTDOWN_MS, GAP_MS, isPast, pickTarget, startSession, stepSession, type SessionState } from './session'
import type { StickValues } from './radio'

const rest: StickValues = { throttle: -1, yaw: 0, pitch: 0, roll: 0 }
const L11 = levelById('1.1')! // throttle, 4 zones, hold 300 ms, limit 2.5 s
const fixedRng = (v: number) => () => v

/** Value in the middle of zone `z` of `count`. */
const mid = (z: number, count: number) => -1 + (2 * z + 1) / count

function toFirstTarget(level = L11, values = rest, rng = fixedRng(0)) {
  let s = startSession(level, 0)
  s = stepSession(s, values, COUNTDOWN_MS - 1, rng)
  expect(s.phase).toBe('countdown')
  s = stepSession(s, values, COUNTDOWN_MS, rng)
  expect(s.phase).toBe('target')
  return s
}

describe('pickTarget', () => {
  it('never picks the zone the stick is already in', () => {
    for (let i = 0; i < 4; i++) {
      const t = pickTarget(L11, { ...rest, throttle: mid(i, 4) }, 0, Math.random)
      expect(t.zone).not.toBe(i)
    }
  })

  it('never repeats the previous target', () => {
    const t = pickTarget(L11, rest, 0, fixedRng(0), { axis: 'throttle', zone: 1 })
    expect(t.zone).toBe(2) // zone 0 = current, zone 1 = previous → first option is 2
  })

  it('picks across all axes in mixed levels', () => {
    const mixed = levelById('1.5')!
    const axes = new Set(Array.from({ length: 50 }, (_, i) => pickTarget(mixed, rest, 0, fixedRng(i / 50)).axis))
    expect(axes).toEqual(new Set(['throttle', 'yaw', 'pitch', 'roll']))
  })
})

describe('stepSession', () => {
  it('counts a hit after holding for the hold time, timing to the start of the hold', () => {
    let s = toFirstTarget()
    const t = s.target!
    const inZone = { ...rest, throttle: mid(t.zone, 4) }
    s = stepSession(s, inZone, COUNTDOWN_MS + 800)
    s = stepSession(s, inZone, COUNTDOWN_MS + 800 + 299)
    expect(s.phase).toBe('target')
    s = stepSession(s, inZone, COUNTDOWN_MS + 800 + 300)
    expect(s.phase).toBe('gap')
    expect(s.results[0]).toMatchObject({ hit: true, timeMs: 800, overshoot: false })
  })

  it('resets the hold if the stick leaves the zone', () => {
    let s = toFirstTarget()
    const z = s.target!.zone
    const inZone = { ...rest, throttle: mid(z, 4) }
    s = stepSession(s, inZone, 2000)
    s = stepSession(s, rest, 2200) // left the zone
    s = stepSession(s, inZone, 2400)
    s = stepSession(s, inZone, 2650)
    expect(s.phase).toBe('target') // only 250 ms since re-entry
    s = stepSession(s, inZone, 2700)
    expect(s.results[0]).toMatchObject({ hit: true, timeMs: 2400 - COUNTDOWN_MS })
  })

  it('flags overshoot when the stick goes past the target', () => {
    let s = toFirstTarget() // stick in zone 0, target zone 1 (rng 0)
    expect(s.target!.zone).toBe(1)
    s = stepSession(s, { ...rest, throttle: mid(3, 4) }, 2000)
    expect(s.target!.overshoot).toBe(true)
  })

  it('records a miss after the timeout', () => {
    let s = toFirstTarget()
    s = stepSession(s, rest, COUNTDOWN_MS + timeoutMs(L11) - 1)
    expect(s.phase).toBe('target')
    s = stepSession(s, rest, COUNTDOWN_MS + timeoutMs(L11))
    expect(s.results[0]).toMatchObject({ hit: false, timeMs: null })
  })

  it('finishes after the last target', () => {
    let s: SessionState = toFirstTarget()
    let now = COUNTDOWN_MS
    while (s.phase !== 'done') {
      now += 10
      const v = s.target ? { ...rest, throttle: mid(s.target.zone, 4) } : rest
      s = stepSession(s, v, now, fixedRng(0.5))
      if (now > 1e6) throw new Error('did not finish')
    }
    expect(s.results).toHaveLength(L11.targetCount)
    expect(s.results.every((r) => r.hit)).toBe(true)
    expect(GAP_MS).toBeGreaterThan(0)
  })
})

describe('isPast', () => {
  it('is true only beyond the target, away from the start', () => {
    expect(isPast(0, 2, 3)).toBe(true)
    expect(isPast(0, 2, 1)).toBe(false)
    expect(isPast(3, 1, 0)).toBe(true)
  })
})

describe('LEVELS', () => {
  it('have unique ids and odd zone counts on centered axes', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
    for (const l of LEVELS) {
      for (const [axis, n] of Object.entries(l.zones)) {
        if (axis !== 'throttle') expect(n! % 2).toBe(1)
      }
    }
  })
})
