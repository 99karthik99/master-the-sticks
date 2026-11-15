/** Radio profile: which raw axis is which stick, plus its calibration. */
import { normalizeAxis, type AxisCalibration } from './axis'

export const STICK_AXES = ['throttle', 'yaw', 'pitch', 'roll'] as const
export type StickAxis = (typeof STICK_AXES)[number]

/** Mode 2: throttle on the left stick. Mode 1: throttle on the right stick. */
export type StickMode = 1 | 2

/** Axes that spring back to center. Throttle stays where you leave it. */
export const SPRING_CENTERED: Readonly<Record<StickAxis, boolean>> = {
  throttle: false,
  yaw: true,
  pitch: true,
  roll: true,
}

export interface AxisBinding {
  /** Index into the gamepad's `axes` array. */
  index: number
  cal: AxisCalibration
}

export interface RadioProfile {
  version: 1
  gamepadId: string
  mode: StickMode
  axes: Record<StickAxis, AxisBinding>
}

/** Normalized stick values: -1..1, where up / right is positive. */
export type StickValues = Record<StickAxis, number>

export function readSticks(raw: readonly number[], profile: RadioProfile): StickValues {
  const out = {} as StickValues
  for (const axis of STICK_AXES) {
    const { index, cal } = profile.axes[axis]
    out[axis] = normalizeAxis(raw[index] ?? 0, cal)
  }
  return out
}

export interface StickSide {
  /** Axis on the horizontal direction. */
  x: StickAxis
  /** Axis on the vertical direction. */
  y: StickAxis
}

export function stickLayout(mode: StickMode): { left: StickSide; right: StickSide } {
  return mode === 2
    ? { left: { x: 'yaw', y: 'throttle' }, right: { x: 'roll', y: 'pitch' } }
    : { left: { x: 'yaw', y: 'pitch' }, right: { x: 'roll', y: 'throttle' } }
}

/** Which physical stick an axis is on, for instructions like "left stick". */
export function stickSideOf(axis: StickAxis, mode: StickMode): 'left' | 'right' {
  const { left } = stickLayout(mode)
  return left.x === axis || left.y === axis ? 'left' : 'right'
}

/** Shape check for a profile loaded from storage. */
export function isValidProfile(x: unknown): x is RadioProfile {
  if (typeof x !== 'object' || x === null) return false
  const p = x as Partial<RadioProfile>
  if (p.version !== 1 || typeof p.gamepadId !== 'string') return false
  if (p.mode !== 1 && p.mode !== 2) return false
  if (typeof p.axes !== 'object' || p.axes === null) return false
  const used = new Set<number>()
  for (const axis of STICK_AXES) {
    const b = (p.axes as Partial<Record<StickAxis, AxisBinding>>)[axis]
    if (!b || !Number.isInteger(b.index) || b.index < 0 || used.has(b.index)) return false
    used.add(b.index)
    const c = b.cal
    if (!c || typeof c.min !== 'number' || typeof c.max !== 'number' || !(c.min < c.max)) return false
    if (c.center !== undefined && typeof c.center !== 'number') return false
  }
  return true
}
