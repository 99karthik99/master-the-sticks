import { describe, expect, it } from 'vitest'
import { zoneOf } from './axis'
import type { StickValues } from './radio'
import { band, dual, flick, fromPct, grid, inRange, isolation, otherSide, throttlePct, zoneLabel, zones, type GenContext, type TargetSpec } from './targets'

const rest: StickValues = { throttle: -1, yaw: 0, pitch: 0, roll: 0 }
const ctx = (over: Partial<GenContext> = {}): GenContext => ({ values: rest, mode: 2, rng: Math.random, ...over })
const satisfied = (t: TargetSpec, v: StickValues) => t.steps[0]!.want.every((r) => inRange(v, r))
const many = (gen: (c: GenContext) => TargetSpec, c = ctx(), n = 200) => Array.from({ length: n }, () => gen(c))

describe('zones', () => {
  it('never targets the zone the stick is in, nor repeats the previous target', () => {
    const g = zones({ throttle: 4 }, 300)
    for (const t of many(g)) expect(satisfied(t, rest)).toBe(false)
    const prev = g(ctx())
    for (const t of many((c) => g({ ...c, prev }))) expect(t.key).not.toBe(prev.key)
  })
})

describe('band', () => {
  it('stays inside its range, has the right width, and avoids the current throttle', () => {
    const here = { ...rest, throttle: fromPct(45) }
    for (const t of many(band({ width: 6, min: 20, max: 70, holdMs: 1000 }), ctx({ values: here }))) {
      const r = t.steps[0]!.want[0]!
      expect(throttlePct(r.lo)).toBeGreaterThanOrEqual(19.5)
      expect(throttlePct(r.hi)).toBeLessThanOrEqual(70.5)
      expect(throttlePct(r.hi) - throttlePct(r.lo)).toBeCloseTo(6)
      expect(satisfied(t, here)).toBe(false)
    }
  })

  it('in step mode, moves the band by a small step from the last one', () => {
    const g = band({ width: 6, min: 20, max: 70, holdMs: 800, step: [6, 15] })
    let prev = g(ctx())
    for (let i = 0; i < 50; i++) {
      const t = g(ctx({ prev, values: { ...rest, throttle: fromPct(prev.meta!.center!) } }))
      const d = Math.abs(t.meta!.center! - prev.meta!.center!)
      expect(d).toBeGreaterThanOrEqual(5) // rounding
      expect(d).toBeLessThanOrEqual(16)
      prev = t
    }
  })
})

describe('grid', () => {
  it('wants both axes of the chosen stick, never the current cell', () => {
    for (const t of many(grid('right', 3, 400))) {
      expect(t.steps[0]!.want.map((r) => r.axis).sort()).toEqual(['pitch', 'roll'])
      expect(satisfied(t, rest)).toBe(false)
    }
  })

  it('"other" means the non-throttle stick in either mode', () => {
    expect(otherSide(2)).toBe('right')
    expect(otherSide(1)).toBe('left')
    const t = grid('other', 3, 400)(ctx({ mode: 1 }))
    expect(t.steps[0]!.want.map((r) => r.axis).sort()).toEqual(['pitch', 'yaw'])
  })
})

describe('isolation', () => {
  it('keeps the other axes within ±band of where they started', () => {
    const v = { ...rest, throttle: 0.2 }
    const t = isolation(['yaw'], ['throttle'], 5, 8, 400)(ctx({ values: v }))
    expect(t.keep).toEqual([{ axis: 'throttle', lo: expect.closeTo(0.04), hi: expect.closeTo(0.36) }])
    expect(t.steps[0]!.want[0]!.axis).toBe('yaw')
  })

  it('"others" keeps all three non-moving axes', () => {
    const t = isolation(['roll'], 'others', 7, 5, 400)(ctx())
    expect(t.keep.map((r) => r.axis).sort()).toEqual(['pitch', 'throttle', 'yaw'])
  })
})

describe('dual', () => {
  it('combines both targets into one step with the longer hold', () => {
    const t = dual(zones({ throttle: 4 }, 500), grid('right', 3, 700))(ctx())
    expect(t.steps).toHaveLength(1)
    expect(t.steps[0]!.want.map((r) => r.axis).sort()).toEqual(['pitch', 'roll', 'throttle'])
    expect(t.steps[0]!.holdMs).toBe(700)
    expect(t.meta!.parts).toHaveLength(2)
  })
})

describe('flick', () => {
  it('goes to the far edge then back to center, with a window', () => {
    const t = flick(['roll'], 800)(ctx({ rng: () => 0 }))
    expect(t.steps).toHaveLength(2)
    expect(t.steps[0]!.want[0]).toEqual({ axis: 'roll', lo: 0.8, hi: 1 })
    expect(t.steps[1]!.want[0]).toEqual({ axis: 'roll', lo: -0.2, hi: 0.2 })
    expect(t.windowMs).toBe(800)
  })

  it('can require throttle to stay in a band', () => {
    const t = flick(['pitch'], 700, 10)(ctx({ values: { ...rest, throttle: 0 } }))
    expect(t.keep[0]).toEqual({ axis: 'throttle', lo: -0.1, hi: 0.1 })
  })
})

describe('zone helpers', () => {
  it('zoneOf agrees with the generated ranges', () => {
    const t = zones({ pitch: 5 }, 0)(ctx({ rng: () => 0 }))
    const r = t.steps[0]!.want[0]!
    expect(zoneOf((r.lo + r.hi) / 2, 5)).toBe(0)
  })
})

describe('zoneLabel', () => {
  it('shows throttle as a percent range', () => {
    expect(zoneLabel('throttle', 0, 5)).toBe('Throttle → 0–20%')
    expect(zoneLabel('throttle', 4, 5)).toBe('Throttle → 80–100%')
    expect(zoneLabel('throttle', 3, 10)).toBe('Throttle → 30–40%')
  })

  it('shows centered axes as a direction, plus deflection when there are more than 3 zones', () => {
    expect(zoneLabel('roll', 0, 3)).toBe('Roll → left')
    expect(zoneLabel('roll', 1, 3)).toBe('Roll → center')
    expect(zoneLabel('pitch', 2, 3)).toBe('Pitch → forward')
    expect(zoneLabel('pitch', 0, 5)).toBe('Pitch → back 60–100%')
    expect(zoneLabel('yaw', 3, 5)).toBe('Yaw → right 20–60%')
    expect(zoneLabel('roll', 2, 5)).toBe('Roll → center (±20%)')
    expect(zoneLabel('roll', 3, 7)).toBe('Roll → center (±14%)')
    expect(zoneLabel('roll', 6, 7)).toBe('Roll → right 71–100%')
  })
})
