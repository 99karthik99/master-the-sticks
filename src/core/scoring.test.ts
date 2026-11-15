import { describe, expect, it } from 'vitest'
import { levelById, type SpeedLevel, type TargetLevel } from './levels'
import { isUnlocked, median, recordAttempt, scoreSpeed, scoreTargets } from './scoring'
import type { TargetResult } from './session'

const L = levelById('1.1') as TargetLevel // limit 2500 ms
const hit = (timeMs: number, overshoot = false): TargetResult => ({ key: 'k', label: 'l', hit: true, timeMs, overshoot })
const miss = (reason: TargetResult['reason'] = 'timeout'): TargetResult => ({ key: 'k', label: 'l', hit: false, timeMs: null, overshoot: false, reason })
const n = (k: number, r: TargetResult) => Array.from({ length: k }, () => r)

describe('median', () => {
  it('handles odd, even and empty', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
  })
})

describe('scoreTargets', () => {
  it('fails below 90% accuracy or over the limit', () => {
    expect(scoreTargets(L, [...n(17, hit(500)), ...n(3, miss())]).passed).toBe(false)
    expect(scoreTargets(L, n(20, hit(2600))).passed).toBe(false)
  })

  it('gives 1, 2 or 3 stars by median and accuracy', () => {
    expect(scoreTargets(L, n(20, hit(2400))).stars).toBe(1)
    expect(scoreTargets(L, n(20, hit(2000))).stars).toBe(2)
    expect(scoreTargets(L, n(20, hit(1500))).stars).toBe(3)
    expect(scoreTargets(L, [...n(18, hit(1500)), ...n(2, miss())]).stars).toBe(2)
  })

  it('counts overshoots and misses by cause', () => {
    const s = scoreTargets(L, [hit(500, true), miss('keep'), miss('slow'), miss('slow')])
    expect(s).toMatchObject({ overshoots: 1, keepMisses: 1, slowMisses: 2 })
  })
})

describe('scoreSpeed', () => {
  it('is hits per minute × accuracy', () => {
    const level = levelById('9.1') as SpeedLevel
    const s = scoreSpeed(level, [...n(30, hit(800)), ...n(10, miss())])
    expect(s.hitsPerMinute).toBe(30)
    expect(s.speed).toBeCloseTo(22.5)
  })
})

describe('progress', () => {
  it('keeps the best stars, median and speed across attempts', () => {
    let p = recordAttempt({}, '1.1', scoreTargets(L, n(20, hit(1500))))
    p = recordAttempt(p, '1.1', scoreTargets(L, n(20, hit(2400))))
    expect(p['1.1']).toMatchObject({ stars: 3, passed: true, bestMedianMs: 1500, plays: 2 })
    const sp = levelById('9.1') as SpeedLevel
    p = recordAttempt(p, '9.1', scoreSpeed(sp, n(10, hit(800))))
    p = recordAttempt(p, '9.1', scoreSpeed(sp, n(5, hit(800))))
    expect(p['9.1']!.bestSpeed).toBe(10)
  })

  it('unlocks in order; the speed test opens after 2.5', () => {
    expect(isUnlocked({}, '1.1')).toBe(true)
    expect(isUnlocked({}, '1.2')).toBe(false)
    const p = recordAttempt({}, '1.1', scoreTargets(L, n(20, hit(2400))))
    expect(isUnlocked(p, '1.2')).toBe(true)
    expect(isUnlocked(p, '9.1')).toBe(false)
    expect(isUnlocked({ '2.5': { stars: 1, passed: true, bestMedianMs: 1, bestAccuracy: 1, plays: 1 } }, '9.1')).toBe(true)
    expect(isUnlocked({ '2.5': { stars: 1, passed: true, bestMedianMs: 1, bestAccuracy: 1, plays: 1 } }, '3.1')).toBe(true)
    expect(isUnlocked(p, 'nope')).toBe(false)
  })
})
