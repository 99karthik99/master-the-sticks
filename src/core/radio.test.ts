import { describe, expect, it } from 'vitest'
import { stickLayout, stickSideOf } from './radio'

describe('stickLayout', () => {
  it('Mode 2 puts throttle on the left stick', () => {
    expect(stickLayout(2).left).toEqual({ x: 'yaw', y: 'throttle' })
    expect(stickSideOf('throttle', 2)).toBe('left')
    expect(stickSideOf('pitch', 2)).toBe('right')
  })
  it('Mode 1 swaps throttle and pitch', () => {
    expect(stickLayout(1).right).toEqual({ x: 'roll', y: 'throttle' })
    expect(stickSideOf('throttle', 1)).toBe('right')
    expect(stickSideOf('pitch', 1)).toBe('left')
  })
})
