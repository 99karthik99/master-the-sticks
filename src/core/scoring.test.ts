import { describe, expect, it } from 'vitest'
import { levelById } from './levels'
import { isUnlocked, median, recordAttempt, scoreLevel } from './scoring'
import type { TargetResult } from './session'

const L = levelById('1.1')! // limit 2500 ms
const hit = (timeMs: number, overshoot = false): TargetResult => ({ axis: 'throttle', count: 4, zone: 1, hit: true, timeMs, overshoot })
const miss: TargetResult = { axis: 'throttle', count: 4, zone: 1, hit: false, timeMs: null, overshoot: false }
const n = (k: number, r: TargetResult) => Array.from({ length: k }, () => r)

describe('median', () => {
  it('handles odd, even and empty', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
  })
})

describe('scoreLevel', () => {
  it('fails below 90% accuracy', () => {
    const s = scoreLevel(L, [...n(17, hit(500)), ...n(3, miss)])
    expect(s.accuracy).toBe(0.85)
    expect(s.passed).toBe(false)
    expect(s.stars).toBe(0)
  })

  it('fails when the median is over the limit', () => {
    expect(scoreLevel(L, n(20, hit(2600))).passed).toBe(false)
  })

  it('gives 1, 2 or 3 stars by median and accuracy', () => {
    expect(scoreLevel(L, n(20, hit(2400))).stars).toBe(1)
    expect(scoreLevel(L, n(20, hit(2000))).stars).toBe(2) // ≤ 0.8 × limit
    expect(scoreLevel(L, n(20, hit(1500))).stars).toBe(3) // ≤ 0.6 × limit, 100%
    expect(scoreLevel(L, [...n(18, hit(1500)), ...n(2, miss)]).stars).toBe(2) // 90% < 97%
  })

  it('counts overshoots', () => {
    expect(scoreLevel(L, [hit(500, true), hit(500)]).overshoots).toBe(1)
  })
})

describe('progress', () => {
  it('keeps the best stars and median across attempts', () => {
    let p = recordAttempt({}, '1.1', scoreLevel(L, n(20, hit(1500))))
    p = recordAttempt(p, '1.1', scoreLevel(L, n(20, hit(2400))))
    expect(p['1.1']).toMatchObject({ stars: 3, bestMedianMs: 1500, plays: 2 })
  })

  it('unlocks a level once the previous one is passed', () => {
    expect(isUnlocked({}, '1.1')).toBe(true)
    expect(isUnlocked({}, '1.2')).toBe(false)
    const p = recordAttempt({}, '1.1', scoreLevel(L, n(20, hit(2400))))
    expect(isUnlocked(p, '1.2')).toBe(true)
    expect(isUnlocked(p, '1.3')).toBe(false)
    expect(isUnlocked(p, 'nope')).toBe(false)
  })
})
