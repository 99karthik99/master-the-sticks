import type { StickSide } from '@core/radio'
import { AXIS_LABEL } from './labels'

interface Props {
  title: string
  side: StickSide
  x: number // -1..1, right positive
  y: number // -1..1, up positive
}

/** A gimbal square with the stick tip drawn where the real stick is. */
export function StickBox({ title, side, x, y }: Props) {
  const cx = 50 + x * 42
  const cy = 50 - y * 42
  return (
    <figure className="stickbox">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${title} position`}>
        <rect x="4" y="4" width="92" height="92" rx="8" className="frame" />
        <line x1="50" y1="8" x2="50" y2="92" className="guide" />
        <line x1="8" y1="50" x2="92" y2="50" className="guide" />
        <line x1="50" y1="50" x2={cx} y2={cy} className="shaft" />
        <circle cx={cx} cy={cy} r="6" className="tip" />
      </svg>
      <figcaption>
        <b>{title}</b>
        <span className="muted">
          {AXIS_LABEL[side.x]} ↔ · {AXIS_LABEL[side.y]} ↕
        </span>
      </figcaption>
    </figure>
  )
}
