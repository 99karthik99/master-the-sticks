/**
 * Pocket drawing geometry, in SVG units.
 *
 * Everything is measured from the RadioMaster Pocket front-view diagram
 * (1024×544 px): body 464 × 330 px, centered at x=505, top edge at y=157.
 * Mapping: X = 400 + (x − 505) × 1.25,  Y = 190 + (y − 157) × 1.25.
 * The drawing is symmetric about X = 400.
 */

/** Where the reference image sits under the drawing (used by the compare page). */
export const REFERENCE = { x: 400 - 505 * 1.25, y: 190 - 157 * 1.25, width: 1024 * 1.25, height: 544 * 1.25 }

export const VIEWBOX = '100 28 600 590'
export const CENTER_X = 400

type Pt = readonly [number, number]

/** Mirror a point to the other half of the drawing. */
const mirror = ([x, y]: Pt): Pt => [2 * CENTER_X - x, y]

/** Closed smooth curve (Catmull-Rom → cubic Bézier) through the points. */
export function smoothClosedPath(points: readonly Pt[]): string {
  const n = points.length
  const f = (v: number) => +v.toFixed(1)
  const at = (i: number) => points[(i + n) % n]!
  let d = `M ${f(at(0)[0])} ${f(at(0)[1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${f(c1[0]!)} ${f(c1[1]!)} ${f(c2[0]!)} ${f(c2[1]!)} ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d} Z`
}

/** Full closed outline from the right half (top-center → clockwise → bottom-center). */
function symmetric(rightHalf: readonly Pt[]): Pt[] {
  return [...rightHalf, ...rightHalf.slice(1, -1).reverse().map(mirror)]
}

/** Move every point of a clockwise closed outline `d` units inward. */
function inset(points: readonly Pt[], d: number): Pt[] {
  const n = points.length
  return points.map((p, i) => {
    const a = points[(i - 1 + n) % n]!
    const b = points[(i + 1) % n]!
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    return [p[0] - (ty / len) * d, p[1] + (tx / len) * d] as const
  })
}

/**
 * Body edge, right half. Measured every 5–10 px down the reference's right
 * edge; the bottom dips between the grips (center 16 px higher than the grips).
 */
const BODY_RIGHT: readonly Pt[] = [
  [400, 190], [545, 190], [600, 193], [636, 207], [655, 232], [661, 256],
  [669, 294], [676, 344], [682.5, 394], [686, 444], [689, 494], [690, 512.5],
  [689, 531], [684.5, 544], [679.5, 556], [672, 569], [661, 581], [645.5, 594],
  [634.5, 600], [612.5, 604], [580, 603], [556, 601], [512.5, 592], [456, 585],
  [400, 582.5],
]
const BODY = symmetric(BODY_RIGHT)
export const BODY_PATH = smoothClosedPath(BODY)
/** Face-plate bevel line just inside the body edge. */
export const BODY_INNER_PATH = smoothClosedPath(inset(BODY, 9))

/**
 * Antenna, right half: crossbar ends rounded, its underside sweeping down
 * into the stem, which runs into the body top.
 */
const ANTENNA_RIGHT: readonly Pt[] = [
  [400, 40], [560, 40], [604, 41], [616, 48], [618, 58], [612, 70], [596, 76],
  [560, 81], [490, 88], [452, 94], [442, 106], [441, 130], [441, 170], [441, 206],
  [400, 206],
]
// The stem's bottom corners sit behind the body, so smoothing them is invisible.
export const ANTENNA_PATH = smoothClosedPath(symmetric(ANTENNA_RIGHT))

/** SA / SD self-locking switches: raised lips over the top corners (right one; mirror for left). */
export const SHOULDER_SWITCH_RIGHT = 'M 545 190 L 545 182 Q 628 179 652 222 L 644 230 Q 622 192 545 190 Z'
export const SHOULDER_SWITCH_LEFT = 'M 255 190 L 255 182 Q 172 179 148 222 L 156 230 Q 178 192 255 190 Z'

/** SB / SC toggles on the top edge. */
export const TOP_TOGGLES = [{ x: 277 }, { x: 523 }] as const

/**
 * Gimbals. Reference (left): center (383.5, 281.5) px, rings r = 55.5 / 48.5 / 45 px,
 * plate ≈ 65 × 64 px with rails at ±35 and ±30.5 px, slot ±11.7 px, knob r ≈ 11 px.
 * Values below are those × 1.25, relative to the gimbal center.
 */
export const GIMBAL = {
  left: { cx: 248, cy: 346 },
  right: { cx: 552, cy: 346 },
  ringOuter: 69.4,
  ringMid: 60.6,
  ringInner: 56.3,
  plate: { halfWidth: 40.5, top: -39.5, bottom: 40, railOuter: 44, railInner: 38, slot: 14.6, window: { x: 36, y: 11 }, slider: 25 },
  knob: 13.5,
  /** Tick marks on the horizontal axis, from the inner ring to the plate. */
  tick: { from: 52, to: 41.5 },
  /** Stick tip travel from center (square gate). */
  travel: 35,
  tipRadius: 9,
}
