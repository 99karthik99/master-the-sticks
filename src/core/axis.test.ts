import { describe, expect, it } from 'vitest'
import { normalizeAxis, zoneOf } from './axis'

describe('normalizeAxis', () => {
  // Real Pocket roll reading: min -0.976, center 0.021, max 1
  const roll = { min: -0.976, center: 0.021, max: 1 }

  it('reads the off-center rest point as exactly 0', () => {
    expect(normalizeAxis(0.021, roll)).toBe(0)
  })

  it('reaches ±1 at the recorded ends even if they are short of ±1', () => {
    expect(normalizeAxis(-0.976, roll)).toBe(-1)
    expect(normalizeAxis(1, roll)).toBe(1)
  })

  it('clamps readings past the calibrated ends', () => {
    expect(normalizeAxis(-1, roll)).toBe(-1)
  })

  it('scales throttle (no center) linearly from min to max', () => {
    const throttle = { min: -1, max: 1 }
    expect(normalizeAxis(-1, throttle)).toBe(-1)
    expect(normalizeAxis(0, throttle)).toBe(0)
    expect(normalizeAxis(1, throttle)).toBe(1)
  })

  it('flips direction when inverted', () => {
    expect(normalizeAxis(1, { min: -1, max: 1, inverted: true })).toBe(-1)
  })

  it('returns 0 for a degenerate calibration instead of NaN', () => {
    expect(normalizeAxis(0.5, { min: 0, max: 0 })).toBe(0)
  })
})

describe('zoneOf', () => {
  it('splits into equal zones from low to high', () => {
    expect(zoneOf(-1, 4)).toBe(0)
    expect(zoneOf(-0.6, 4)).toBe(0)
    expect(zoneOf(-0.4, 4)).toBe(1)
    expect(zoneOf(0.4, 4)).toBe(2)
    expect(zoneOf(1, 4)).toBe(3)
  })

  it('puts center in the middle zone for odd counts', () => {
    expect(zoneOf(0, 3)).toBe(1)
    expect(zoneOf(0, 7)).toBe(3)
  })

  it('rejects invalid zone counts', () => {
    expect(() => zoneOf(0, 0)).toThrow()
    expect(() => zoneOf(0, 2.5)).toThrow()
  })
})
