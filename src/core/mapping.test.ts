import { describe, expect, it } from 'vitest'
import { detectMovedAxis } from './mapping'

const rest = [0, 0, -1, 0, 0, 0, 0, 0] // Pocket at rest, throttle down

describe('detectMovedAxis', () => {
  it('finds the axis pushed furthest', () => {
    expect(detectMovedAxis(rest, [0, 0, 0.9, 0.05, 0, 0, 0, 0])).toEqual({ index: 2, delta: 1.9 })
  })

  it('reports direction through the sign of delta', () => {
    expect(detectMovedAxis(rest, [0, -0.8, -1, 0, 0, 0, 0, 0])?.delta).toBeCloseTo(-0.8)
  })

  it('ignores small movements', () => {
    expect(detectMovedAxis(rest, [0.3, 0, -1, 0, 0, 0, 0, 0])).toBeNull()
  })

  it('skips excluded axes (already mapped)', () => {
    const cur = [0.1, 0, 1, 0.7, 0, 0, 0, 0]
    expect(detectMovedAxis(rest, cur, [2])?.index).toBe(3)
  })

  it('refuses to guess when two axes move about the same (diagonal)', () => {
    expect(detectMovedAxis(rest, [0.8, 0.75, -1, 0, 0, 0, 0, 0])).toBeNull()
  })

  it('accepts a slightly diagonal push', () => {
    expect(detectMovedAxis(rest, [0.9, 0.3, -1, 0, 0, 0, 0, 0])?.index).toBe(0)
  })
})
