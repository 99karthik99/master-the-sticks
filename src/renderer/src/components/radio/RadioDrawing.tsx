import { stickLayout, type StickAxis, type StickMode, type StickValues } from '@core/radio'
import { AXIS_LABEL } from '../labels'
import { CenterControls } from './CenterControls'
import { GIMBAL, REFERENCE, VIEWBOX } from './geometry'
import { Gimbal } from './Gimbal'
import { LowerControls } from './LowerControls'
import { Outline } from './Outline'

type Interval = { lo: number; hi: number }

/**
 * What to draw over the gimbals while training. Keyed by axis; each gimbal
 * draws the parts that concern its own two axes.
 */
export interface Guide {
  /** Zone stripes per axis. */
  divisions?: Partial<Record<StickAxis, number>>
  /** Target box: the stick must be inside these ranges (missing axis = any). */
  target?: Partial<Record<StickAxis, Interval>>
  /** Axes currently past their target: shown in red. */
  pastAxes?: readonly StickAxis[]
  /** 0..1 hold progress while the whole target is held. */
  holdProgress?: number
  /** Ranges the stick must stay inside (isolation). */
  keep?: Partial<Record<StickAxis, Interval>>
  /** Moving target for tracking, and its tolerance (normalized units). */
  ghost?: Partial<Record<StickAxis, number>>
  ghostTolerance?: number
}

export type Section = 'outline' | 'gimbals' | 'center' | 'lower'

interface Props {
  mode: StickMode
  values: StickValues
  guide?: Guide | null
  /** Sections to draw (default: all). Used by the compare page. */
  sections?: readonly Section[]
  /** Dev only: reference image drawn underneath, for checking proportions. */
  underlay?: { href: string; opacity: number } | null
}

const ALL: readonly Section[] = ['outline', 'gimbals', 'center', 'lower']

/** Line drawing of the RadioMaster Pocket (front view), with both sticks live. */
export function RadioDrawing({ mode, values, guide, sections = ALL, underlay }: Props) {
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
            <Gimbal pos={GIMBAL.left} side={left} values={values} guide={guide} />
            <Gimbal pos={GIMBAL.right} side={right} values={values} guide={guide} />
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
