import { stickLayout, type StickAxis, type StickMode, type StickValues } from '@core/radio'
import { AXIS_LABEL } from '../labels'
import { CenterControls } from './CenterControls'
import { GIMBAL, REFERENCE, VIEWBOX } from './geometry'
import { Gimbal } from './Gimbal'
import { LowerControls } from './LowerControls'
import { Outline } from './Outline'

/** Zone bands drawn inside one gimbal, for the axis being trained. */
export interface ZoneOverlay {
  axis: StickAxis
  count: number
  /** Zone the user should reach, if any. */
  target?: number | null
  /** Zone the stick is in right now. */
  current?: number | null
  /** Stick is currently past the target: shown in red. */
  overshoot?: boolean
  /** 0..1 progress of the hold while the stick is in the target. */
  holdProgress?: number
}

export type Section = 'outline' | 'gimbals' | 'center' | 'lower'

interface Props {
  mode: StickMode
  values: StickValues
  zones?: ZoneOverlay | null
  /** Sections to draw (default: all). Used by the compare page. */
  sections?: readonly Section[]
  /** Dev only: reference image drawn underneath, for checking proportions. */
  underlay?: { href: string; opacity: number } | null
}

const ALL: readonly Section[] = ['outline', 'gimbals', 'center', 'lower']

/** Line drawing of the RadioMaster Pocket (front view), with both sticks live. */
export function RadioDrawing({ mode, values, zones, sections = ALL, underlay }: Props) {
  const { left, right } = stickLayout(mode)
  const show = (s: Section) => sections.includes(s)
  return (
    <figure className="radio-figure">
      <svg className="radio" viewBox={VIEWBOX} role="img" aria-label="Radio with live stick positions">
        {show('outline') && <Outline />}
        {show('center') && <CenterControls />}
        {show('lower') && <LowerControls />}
        {show('gimbals') && (
          <>
            <Gimbal pos={GIMBAL.left} side={left} values={values} zones={zones} />
            <Gimbal pos={GIMBAL.right} side={right} values={values} zones={zones} />
          </>
        )}
        {underlay && (
          <image
            href={underlay.href}
            x={REFERENCE.x}
            y={REFERENCE.y}
            width={REFERENCE.width}
            height={REFERENCE.height}
            opacity={underlay.opacity}
            style={{ mixBlendMode: 'multiply' }}
          />
        )}
      </svg>
      <figcaption className="radio-caption">
        <span>Left stick: {AXIS_LABEL[left.x]} ↔ · {AXIS_LABEL[left.y]} ↕</span>
        <span>Right stick: {AXIS_LABEL[right.x]} ↔ · {AXIS_LABEL[right.y]} ↕</span>
      </figcaption>
    </figure>
  )
}
