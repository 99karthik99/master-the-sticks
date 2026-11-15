import { useEffect, useRef, useState } from 'react'
import {
  buildProfile,
  extendRanges,
  isNearMiddle,
  isRangeCovered,
  isSteady,
  type AxisAssignment,
  type Range,
} from '@core/calibration'
import { detectMovedAxis } from '@core/mapping'
import {
  SPRING_CENTERED,
  STICK_AXES,
  stickSideOf,
  type RadioProfile,
  type StickAxis,
  type StickMode,
} from '@core/radio'
import type { PadSnapshot } from '../radio/useGamepad'
import { AXIS_LABEL } from '../components/labels'

type Step = 'mode' | 'map' | 'range' | 'center'

const STEPS: { id: Step; label: string }[] = [
  { id: 'mode', label: 'Stick mode' },
  { id: 'map', label: 'Map sticks' },
  { id: 'range', label: 'Full range' },
  { id: 'center', label: 'Center' },
]

/** Order and direction of the mapping prompts. Up / right become positive. */
const MAP_PROMPTS: { axis: StickAxis; dir: 'up' | 'right' }[] = [
  { axis: 'throttle', dir: 'up' },
  { axis: 'yaw', dir: 'right' },
  { axis: 'pitch', dir: 'up' },
  { axis: 'roll', dir: 'right' },
]

const MOVE_THRESHOLD = 0.6 // raw units the stick must move to count
const CONFIRM_MS = 250 // how long the move must be held
const RELEASE_TOLERANCE = 0.2 // how close to rest counts as "let go"
const CENTER_HOLD_MS = 600 // how long sticks must rest before capturing center

interface Props {
  pad: PadSnapshot
  initialMode?: StickMode
  onDone: (profile: RadioProfile) => void
  onCancel?: () => void
}

export function SetupWizard({ pad, initialMode = 2, onDone, onCancel }: Props) {
  const [step, setStep] = useState<Step>('mode')
  const [mode, setMode] = useState<StickMode>(initialMode)

  // Map step
  const [assigned, setAssigned] = useState<Partial<Record<StickAxis, AxisAssignment>>>({})
  const [promptIdx, setPromptIdx] = useState(0)
  const [waitRelease, setWaitRelease] = useState<number | null>(null)
  const baseline = useRef<number[] | null>(null)
  const candidate = useRef<{ index: number; since: number } | null>(null)

  // Range step
  const [ranges, setRanges] = useState<Range[] | null>(null)

  // Center step
  const restFrames = useRef<{ t: number; axes: readonly number[] }[]>([])
  const [centerProgress, setCenterProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const restart = () => {
    setStep('mode')
    setAssigned({})
    setPromptIdx(0)
    setWaitRelease(null)
    baseline.current = null
    candidate.current = null
    setRanges(null)
    restFrames.current = []
    setCenterProgress(0)
    setError(null)
  }

  // Runs every frame (pad.t changes each animation frame).
  useEffect(() => {
    const { axes, t } = pad

    if (step === 'map') {
      if (waitRelease !== null) {
        const rest = baseline.current?.[waitRelease] ?? 0
        if (Math.abs((axes[waitRelease] ?? 0) - rest) < RELEASE_TOLERANCE) {
          setWaitRelease(null)
          baseline.current = null
        }
        return
      }
      if (promptIdx >= MAP_PROMPTS.length) {
        setStep('range')
        return
      }
      if (!baseline.current) {
        baseline.current = [...axes]
        candidate.current = null
        return
      }
      const exclude = Object.values(assigned).map((a) => a.index)
      const move = detectMovedAxis(baseline.current, axes, exclude, MOVE_THRESHOLD)
      if (!move) {
        candidate.current = null
        return
      }
      const c = candidate.current
      if (!c || c.index !== move.index) {
        candidate.current = { index: move.index, since: t }
        return
      }
      if (t - c.since >= CONFIRM_MS) {
        const prompt = MAP_PROMPTS[promptIdx]!
        setAssigned((prev) => ({ ...prev, [prompt.axis]: { index: move.index, inverted: move.delta < 0 } }))
        candidate.current = null
        if (SPRING_CENTERED[prompt.axis]) setWaitRelease(move.index)
        else baseline.current = null
        setPromptIdx((i) => i + 1)
      }
      return
    }

    if (step === 'range') {
      setRanges((r) => extendRanges(r, axes))
      return
    }

    if (step === 'center' && ranges) {
      const springIdx = STICK_AXES.filter((a) => SPRING_CENTERED[a]).map((a) => assigned[a]!.index)
      const frames = [...restFrames.current, { t, axes }]
      const steady = isSteady(frames.map((f) => f.axes), springIdx)
      const centered = springIdx.every((i) => isNearMiddle(axes[i] ?? 0, ranges[i]!))
      if (!steady || !centered) {
        restFrames.current = [{ t, axes }]
        setCenterProgress(0)
        return
      }
      restFrames.current = frames
      const held = t - frames[0]!.t
      setCenterProgress(Math.min(1, held / CENTER_HOLD_MS))
      if (held >= CENTER_HOLD_MS) {
        try {
          const profile = buildProfile(pad.id, mode, assigned as Record<StickAxis, AxisAssignment>, ranges, axes)
          onDone(profile)
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e))
          restFrames.current = []
        }
      }
    }
    // Intentionally keyed on the frame time: this is the per-frame update.
  }, [pad.t])

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const mappedAxes = MAP_PROMPTS.map((p) => p.axis).filter((a) => assigned[a])
  const allCovered = ranges !== null && STICK_AXES.every((a) => isRangeCovered(ranges[assigned[a]!.index]))

  return (
    <section className="setup">
      <header className="setup-head">
        <h2>Set up your radio</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i === stepIndex ? 'current' : i < stepIndex ? 'done' : ''}>
              {s.label}
            </li>
          ))}
        </ol>
      </header>

      {step === 'mode' && (
        <div className="panel">
          <p>Which stick mode do you fly?</p>
          <div className="choices">
            {([2, 1] as const).map((m) => (
              <button
                key={m}
                className={`choice ${mode === m ? 'selected' : ''}`}
                onClick={() => setMode(m)}
              >
                <b>Mode {m}</b>
                <span className="muted">
                  {m === 2
                    ? 'Throttle and yaw on the left stick. Most common.'
                    : 'Pitch and yaw on the left stick, throttle on the right.'}
                </span>
              </button>
            ))}
          </div>
          <div className="actions">
            {onCancel && <button onClick={onCancel}>Cancel</button>}
            <button className="primary" onClick={() => setStep('map')}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="panel">
          {waitRelease !== null ? (
            <p className="prompt">Got it. Now let go of the stick.</p>
          ) : promptIdx < MAP_PROMPTS.length ? (
            <p className="prompt">
              Push <b>{AXIS_LABEL[MAP_PROMPTS[promptIdx]!.axis]}</b> fully{' '}
              <b>{MAP_PROMPTS[promptIdx]!.dir}</b> and hold it
              <span className="muted">
                {' '}
                ({stickSideOf(MAP_PROMPTS[promptIdx]!.axis, mode)} stick)
              </span>
            </p>
          ) : null}
          <ul className="checklist">
            {MAP_PROMPTS.map(({ axis }) => (
              <li key={axis} className={assigned[axis] ? 'done' : ''}>
                {AXIS_LABEL[axis]}
                {assigned[axis] && (
                  <span className="muted">
                    {' '}
                    → axis {assigned[axis]!.index}
                    {assigned[axis]!.inverted ? ' (inverted)' : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="actions">
            <button onClick={restart}>Start over</button>
          </div>
        </div>
      )}

      {step === 'range' && (
        <div className="panel">
          <p className="prompt">
            Move both sticks around their full range: circle them and hit every corner.
          </p>
          <div className="range-bars">
            {mappedAxes.map((axis) => {
              const r = ranges?.[assigned[axis]!.index]
              const left = r ? ((r.min + 1) / 2) * 100 : 50
              const width = r ? ((r.max - r.min) / 2) * 100 : 0
              return (
                <div key={axis} className="range-row">
                  <span>{AXIS_LABEL[axis]}</span>
                  <div className="track">
                    <div className={`fill ${isRangeCovered(r) ? 'ok' : ''}`} style={{ left: `${left}%`, width: `${width}%` }} />
                  </div>
                  <span className="muted">{isRangeCovered(r) ? 'done' : 'keep going'}</span>
                </div>
              )
            })}
          </div>
          <div className="actions">
            <button onClick={restart}>Start over</button>
            <button className="primary" disabled={!allCovered} onClick={() => setStep('center')}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'center' && (
        <div className="panel">
          <p className="prompt">
            Let go of both sticks so they spring back to center. Leave throttle wherever it is.
          </p>
          <div className="track progress">
            <div className="fill ok" style={{ left: 0, width: `${centerProgress * 100}%` }} />
          </div>
          {error && <p className="error">Something went wrong: {error}. Please start over.</p>}
          <div className="actions">
            <button onClick={restart}>Start over</button>
          </div>
        </div>
      )}
    </section>
  )
}
