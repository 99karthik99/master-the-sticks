import { zoneOf, zoneRange } from '@core/axis'
import type { StickAxis, StickSide, StickValues } from '@core/radio'
import { GIMBAL } from './geometry'
import type { Guide } from './RadioDrawing'

const { ringOuter, ringMid, ringInner, plate, knob, tick, travel, tipRadius } = GIMBAL

interface Props {
  pos: { cx: number; cy: number }
  side: StickSide
  values: StickValues
  guide?: Guide | null
}

/**
 * Section 2: one gimbal — bezel rings, the gimbal plate (rails, panels, slot,
 * knob), training guides, and the live stick on top.
 */
export function Gimbal({ pos, side, values, guide }: Props) {
  const { cx, cy } = pos
  const tipX = cx + values[side.x] * travel
  const tipY = cy - values[side.y] * travel
  const mine = (axis: StickAxis) => axis === side.x || axis === side.y
  const active =
    !!guide &&
    [guide.divisions, guide.target, guide.keep, guide.ghost].some((m) => m && (Object.keys(m) as StickAxis[]).some(mine))
  const clipId = `gimbal-${cx}`

  return (
    <g className={`section-gimbal${active ? ' has-zones' : ''}`}>
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={ringInner} />
      </clipPath>

      {/* Bezel: thick outer ring, then two thin inner rings */}
      <circle cx={cx} cy={cy} r={ringOuter} className="gimbal-outer" />
      <circle cx={cx} cy={cy} r={ringMid} className="gimbal-ring" />
      <circle cx={cx} cy={cy} r={ringInner} className="gimbal-bg" />

      {active && (
        <g clipPath={`url(#${clipId})`}>
          <Guides cx={cx} cy={cy} side={side} values={values} guide={guide!} />
        </g>
      )}

      <Plate cx={cx} cy={cy} />
      <circle cx={cx} cy={cy} r={ringInner} className="gimbal-inner" />
      {active && guide!.ghost && <Ghost cx={cx} cy={cy} side={side} guide={guide!} />}

      {/* Stick: shaft from the knob to the tip */}
      <line x1={cx} y1={cy} x2={tipX} y2={tipY} className="stick-shaft" />
      <circle cx={tipX} cy={tipY} r={tipRadius} className="stick-tip" />
    </g>
  )
}

/** Offset from center for a value; ±1 reaches the ring so edge zones fill the gimbal. */
const pos = (v: number) => (v <= -1 ? -ringInner : v >= 1 ? ringInner : v * travel)

/** Rectangle (in gimbal pixels) covering x-range × y-range; a missing range spans the whole gimbal. */
function box(cx: number, cy: number, xr?: { lo: number; hi: number }, yr?: { lo: number; hi: number }) {
  const x0 = xr ? pos(xr.lo) : -ringInner
  const x1 = xr ? pos(xr.hi) : ringInner
  const y0 = yr ? pos(yr.lo) : -ringInner
  const y1 = yr ? pos(yr.hi) : ringInner
  return { x: cx + x0, y: cy - y1, width: x1 - x0, height: y1 - y0 }
}

function Guides({ cx, cy, side, values, guide }: { cx: number; cy: number; side: StickSide; values: StickValues; guide: Guide }) {
  const els: React.ReactNode[] = []
  const nx = guide.divisions?.[side.x]
  const ny = guide.divisions?.[side.y]

  // Zone stripes (both axes → a grid)
  if (nx) for (let i = 0; i < nx; i++) els.push(<rect key={`sx${i}`} {...box(cx, cy, zoneRange(i, nx))} className={`band ${i % 2 ? 'odd' : 'even'}`} />)
  if (ny) for (let j = 0; j < ny; j++) els.push(<rect key={`sy${j}`} {...box(cx, cy, undefined, zoneRange(j, ny))} className={`band ${j % 2 ? 'odd' : 'even'}${nx ? ' cross' : ''}`} />)
  // The zone / cell the stick is in now
  if (nx || ny) {
    const xr = nx ? zoneRange(zoneOf(values[side.x], nx), nx) : undefined
    const yr = ny ? zoneRange(zoneOf(values[side.y], ny), ny) : undefined
    els.push(<rect key="current" {...box(cx, cy, xr, yr)} className="band current" />)
  }

  // Keep band (isolation)
  const kx = guide.keep?.[side.x]
  const ky = guide.keep?.[side.y]
  if (kx || ky) els.push(<rect key="keep" {...box(cx, cy, kx, ky)} className="keep" />)

  // Target box
  const tx = guide.target?.[side.x]
  const ty = guide.target?.[side.y]
  if (tx || ty) {
    const inside = (!tx || (values[side.x] >= tx.lo && values[side.x] <= tx.hi)) && (!ty || (values[side.y] >= ty.lo && values[side.y] <= ty.hi))
    const past = guide.pastAxes?.some((a) => (a === side.x && tx) || (a === side.y && ty))
    const holding = guide.holdProgress !== undefined
    const cls = past ? 'overshoot' : inside ? (holding ? 'holding' : 'hit') : 'target'
    const b = box(cx, cy, tx, ty)
    els.push(<rect key="target" {...b} className={`band ${cls}`} />)
    if (inside && holding) {
      const p = Math.max(0, Math.min(1, guide.holdProgress!))
      // Fill along the box's long direction: left → right for a horizontal band, else bottom → top
      els.push(
        b.width >= b.height ? (
          <rect key="fill" x={b.x} y={b.y} width={b.width * p} height={b.height} className="band-fill" />
        ) : (
          <rect key="fill" x={b.x} y={b.y + b.height * (1 - p)} width={b.width} height={b.height * p} className="band-fill" />
        ),
      )
    }
  }
  return <>{els}</>
}

/** Tracking target: a ring at the path position (or a band when only one axis is followed). */
function Ghost({ cx, cy, side, guide }: { cx: number; cy: number; side: StickSide; guide: Guide }) {
  const gx = guide.ghost?.[side.x]
  const gy = guide.ghost?.[side.y]
  if (gx === undefined && gy === undefined) return null
  const tol = (guide.ghostTolerance ?? 0.15) * travel
  if (gx !== undefined && gy !== undefined) {
    return <circle cx={cx + gx * travel} cy={cy - gy * travel} r={tol + tipRadius} className="ghost" />
  }
  return gy !== undefined ? (
    <rect x={cx - ringInner} y={cy - gy * travel - tol} width={ringInner * 2} height={tol * 2} className="ghost band-ghost" clipPath={`url(#gimbal-${cx})`} />
  ) : (
    <rect x={cx + gx! * travel - tol} y={cy - ringInner} width={tol * 2} height={ringInner * 2} className="ghost band-ghost" clipPath={`url(#gimbal-${cx})`} />
  )
}

/** The gimbal mechanism seen from the front: rails, top/bottom panels, slot, knob. */
function Plate({ cx, cy }: { cx: number; cy: number }) {
  const { halfWidth: w, top, bottom, railOuter, railInner, slot, window: win, slider } = plate
  const x = (dx: number) => cx + dx
  const y = (dy: number) => cy + dy
  return (
    <g className="gimbal-plate">
      {/* Top and bottom edges, slightly bowed like the reference */}
      <path d={`M ${x(-w)} ${y(top + 1.5)} Q ${cx} ${y(top - 1.5)} ${x(w)} ${y(top + 1.5)}`} />
      <path d={`M ${x(-w)} ${y(bottom - 1.5)} Q ${cx} ${y(bottom + 1.5)} ${x(w)} ${y(bottom - 1.5)}`} />
      {/* Rails */}
      {[-railOuter, -railInner, railInner, railOuter].map((dx) => (
        <line key={dx} x1={x(dx)} y1={y(top + 1)} x2={x(dx)} y2={y(bottom - 1)} />
      ))}
      {/* Horizontal slot the stick slides in */}
      <rect x={x(-railOuter)} y={y(-slot)} width={railOuter * 2} height={slot * 2} rx={2} className="slot" />
      <rect x={x(-win.x)} y={y(-win.y)} width={win.x * 2} height={win.y * 2} rx={2} />
      <line x1={x(-slider)} y1={y(-win.y)} x2={x(-slider)} y2={y(win.y)} />
      <line x1={x(slider)} y1={y(-win.y)} x2={x(slider)} y2={y(win.y)} />
      {/* Tick marks either side */}
      <line x1={x(-tick.from)} y1={cy} x2={x(-tick.to)} y2={cy} />
      <line x1={x(tick.to)} y1={cy} x2={x(tick.from)} y2={cy} />
      {/* Knurled knob */}
      <circle cx={cx} cy={cy} r={knob} className="knob" />
      <circle cx={cx} cy={cy} r={knob - 3} className="knurl" />
      <circle cx={cx} cy={cy} r={4.5} />
    </g>
  )
}
