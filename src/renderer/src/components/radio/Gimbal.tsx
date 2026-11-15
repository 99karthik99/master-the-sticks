import type { StickSide, StickValues } from '@core/radio'
import { GIMBAL } from './geometry'
import type { ZoneOverlay } from './RadioDrawing'

const { ringOuter, ringMid, ringInner, plate, knob, tick, travel, tipRadius } = GIMBAL

interface Props {
  pos: { cx: number; cy: number }
  side: StickSide
  values: StickValues
  zones?: ZoneOverlay | null
}

/**
 * Section 2: one gimbal — bezel rings, the gimbal plate (rails, panels, slot,
 * knob), optional zone bands, and the live stick on top.
 */
export function Gimbal({ pos, side, values, zones }: Props) {
  const { cx, cy } = pos
  const tipX = cx + values[side.x] * travel
  const tipY = cy - values[side.y] * travel
  const overlay = zones && (zones.axis === side.x || zones.axis === side.y) ? zones : null
  const clipId = `gimbal-${cx}`

  return (
    <g className={`section-gimbal${overlay ? ' has-zones' : ''}`}>
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={ringInner} />
      </clipPath>

      {/* Bezel: thick outer ring, then two thin inner rings */}
      <circle cx={cx} cy={cy} r={ringOuter} className="gimbal-outer" />
      <circle cx={cx} cy={cy} r={ringMid} className="gimbal-ring" />
      <circle cx={cx} cy={cy} r={ringInner} className="gimbal-bg" />

      {overlay && (
        <g clipPath={`url(#${clipId})`}>
          <ZoneBands cx={cx} cy={cy} horizontal={overlay.axis === side.x} overlay={overlay} />
        </g>
      )}

      <Plate cx={cx} cy={cy} />
      <circle cx={cx} cy={cy} r={ringInner} className="gimbal-inner" />

      {/* Stick: shaft from the knob to the tip */}
      <line x1={cx} y1={cy} x2={tipX} y2={tipY} className="stick-shaft" />
      <circle cx={tipX} cy={tipY} r={tipRadius} className="stick-tip" />
    </g>
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

/** Offset from center for zone edge i, with the outer bands stretched to the ring. */
function edgeOffset(i: number, count: number): number {
  if (i <= 0) return -ringInner
  if (i >= count) return ringInner
  return (-1 + (2 * i) / count) * travel
}

function bandClass(i: number, o: ZoneOverlay): string {
  const isTarget = o.target === i
  const isCurrent = o.current === i
  if (isTarget && o.overshoot) return 'band overshoot'
  if (isTarget && isCurrent) return o.holdProgress === undefined ? 'band hit' : 'band holding'
  if (isTarget) return 'band target'
  if (isCurrent) return 'band current'
  return i % 2 === 0 ? 'band even' : 'band odd'
}

function ZoneBands({ cx, cy, horizontal, overlay }: { cx: number; cy: number; horizontal: boolean; overlay: ZoneOverlay }) {
  const bands = []
  for (let i = 0; i < overlay.count; i++) {
    const a = edgeOffset(i, overlay.count)
    const b = edgeOffset(i + 1, overlay.count)
    bands.push(
      horizontal ? (
        // Axis runs left → right: zone 0 on the left
        <rect key={i} x={cx + a} y={cy - ringInner} width={b - a} height={ringInner * 2} className={bandClass(i, overlay)} />
      ) : (
        // Axis runs bottom → top: zone 0 at the bottom
        <rect key={i} x={cx - ringInner} y={cy - b} width={ringInner * 2} height={b - a} className={bandClass(i, overlay)} />
      ),
    )
  }
  // Hold progress: the target band fills with green as the hold completes.
  const { target, current, holdProgress } = overlay
  if (target != null && target === current && holdProgress !== undefined) {
    const a = edgeOffset(target, overlay.count)
    const b = edgeOffset(target + 1, overlay.count)
    const p = Math.max(0, Math.min(1, holdProgress))
    const span = ringInner * 2
    bands.push(
      horizontal ? (
        // Vertical band: fill bottom → top
        <rect key="fill" x={cx + a} y={cy + ringInner - span * p} width={b - a} height={span * p} className="band-fill" />
      ) : (
        // Horizontal band: fill left → right
        <rect key="fill" x={cx - ringInner} y={cy - b} width={span * p} height={b - a} className="band-fill" />
      ),
    )
  }
  return <>{bands}</>
}
