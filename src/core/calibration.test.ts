import { describe, expect, it } from 'vitest'
import { buildProfile, extendRanges, isNearMiddle, isRangeCovered, isSteady } from './calibration'
import { isValidProfile, readSticks } from './radio'

describe('extendRanges', () => {
  it('starts from the first reading and grows with later ones', () => {
    let r = extendRanges(null, [0, 0.5])
    r = extendRanges(r, [-0.9, 0.2])
    r = extendRanges(r, [0.8, 0.6])
    expect(r).toEqual([
      { min: -0.9, max: 0.8 },
      { min: 0.2, max: 0.6 },
    ])
  })
})

describe('isRangeCovered', () => {
  it('needs most of the full range', () => {
    expect(isRangeCovered({ min: -0.976, max: 1 })).toBe(true)
    expect(isRangeCovered({ min: -0.5, max: 0.5 })).toBe(false)
    expect(isRangeCovered(undefined)).toBe(false)
  })
})

describe('isSteady', () => {
  it('is true when listed axes barely move', () => {
    expect(isSteady([[0, 0.5], [0.01, -0.5], [0.02, 0.9]], [0])).toBe(true)
  })
  it('is false when an axis moves more than the tolerance', () => {
    expect(isSteady([[0], [0.1]], [0])).toBe(false)
  })
  it('is false with no frames', () => {
    expect(isSteady([], [0])).toBe(false)
  })
})

describe('isNearMiddle', () => {
  it('accepts values in the middle of the range', () => {
    expect(isNearMiddle(0.021, { min: -0.976, max: 1 })).toBe(true)
    expect(isNearMiddle(0.6, { min: -1, max: 1 })).toBe(false)
  })
})

describe('buildProfile', () => {
  // Real Pocket numbers from docs/radio-pocket.md
  const ranges = [
    { min: -0.976, max: 1 },
    { min: -0.991, max: 1 },
    { min: -1, max: 1 },
    { min: -1, max: 0.996 },
  ]
  const rest = [0.021, 0.003, -0.885, 0]
  const assignments = {
    roll: { index: 0, inverted: false },
    pitch: { index: 1, inverted: false },
    throttle: { index: 2, inverted: false },
    yaw: { index: 3, inverted: false },
  }

  it('builds a valid profile; throttle has no center, the others do', () => {
    const p = buildProfile('Pocket', 2, assignments, ranges, rest)
    expect(isValidProfile(p)).toBe(true)
    expect(p.axes.throttle.cal.center).toBeUndefined()
    expect(p.axes.roll.cal.center).toBe(0.021)
  })

  it('reads the sticks: rest is 0, full deflections are ±1, throttle down is -1', () => {
    const p = buildProfile('Pocket', 2, assignments, ranges, rest)
    expect(readSticks([0.021, 0.003, -1, 0], p)).toEqual({ throttle: -1, yaw: 0, pitch: 0, roll: 0 })
    expect(readSticks([1, -0.991, 1, -1], p)).toEqual({ throttle: 1, yaw: -1, pitch: -1, roll: 1 })
  })

  it('applies inversion so up/right is always positive', () => {
    const inv = { ...assignments, pitch: { index: 1, inverted: true } }
    const p = buildProfile('Pocket', 2, inv, ranges, rest)
    expect(readSticks([0, -0.991, 0, 0], p).pitch).toBe(1)
  })

  it('throws when an axis range was not covered', () => {
    const short = [...ranges]
    short[3] = { min: -0.2, max: 0.2 }
    expect(() => buildProfile('Pocket', 2, assignments, short, rest)).toThrow(/yaw/)
  })
})

describe('isValidProfile', () => {
  it('rejects junk and duplicate axis indices', () => {
    expect(isValidProfile(null)).toBe(false)
    expect(isValidProfile({ version: 1 })).toBe(false)
    const cal = { min: -1, max: 1 }
    expect(
      isValidProfile({
        version: 1, gamepadId: 'x', mode: 2,
        axes: { throttle: { index: 0, cal }, yaw: { index: 0, cal }, pitch: { index: 1, cal }, roll: { index: 2, cal } },
      }),
    ).toBe(false)
  })
})
