import { useState } from 'react'
import { zoneOf, zoneRange } from '@core/axis'
import { readSticks, SPRING_CENTERED, STICK_AXES, type RadioProfile, type StickAxis } from '@core/radio'
import { AxisBar } from '../components/AxisBar'
import { AXIS_LABEL } from '../components/labels'
import { RadioDrawing, type Guide } from '../components/radio/RadioDrawing'
import { zoneLabel } from '@core/targets'
import type { PadSnapshot } from '../radio/useGamepad'

interface Props {
  pad: PadSnapshot
  profile: RadioProfile
  onRedoSetup: () => void
}

const ZONE_COUNTS = [3, 4, 5, 6, 7, 8, 9, 10]
/** Stage 1 defaults: 20% steps for throttle, 3 zones (odd, so there's a center) for the others. */
const defaultCount = (axis: StickAxis) => (SPRING_CENTERED[axis] ? 3 : 5)

/** Live radio drawing, per-axis bars, and a zone preview to try the colour coding. */
export function LiveView({ pad, profile, onRedoSetup }: Props) {
  const v = readSticks(pad.axes, profile)
  const [axis, setAxis] = useState<StickAxis | null>(null)
  const [count, setCount] = useState(4)
  const [target, setTarget] = useState<number | null>(null)

  const chooseAxis = (a: StickAxis | null) => {
    setAxis(a)
    setTarget(null)
    if (a) setCount(defaultCount(a))
  }

  const newTarget = () => {
    let t: number
    do t = Math.floor(Math.random() * count)
    while (count > 1 && t === target)
    setTarget(t)
  }

  const guide: Guide | null = axis
    ? { divisions: { [axis]: count }, ...(target !== null ? { target: { [axis]: zoneRange(target, count) } } : {}) }
    : null
  const inTarget = axis !== null && target !== null && zoneOf(v[axis], count) === target

  return (
    <section className="live">
      <RadioDrawing mode={profile.mode} values={v} guide={guide} />

      <div className="zone-preview">
        <span className="muted">Zone preview</span>
        <select value={axis ?? ''} onChange={(e) => chooseAxis((e.target.value || null) as StickAxis | null)}>
          <option value="">Off</option>
          {STICK_AXES.map((a) => (
            <option key={a} value={a}>{AXIS_LABEL[a]}</option>
          ))}
        </select>
        {axis && (
          <>
            <select value={count} onChange={(e) => { setCount(+e.target.value); setTarget(null) }}>
              {ZONE_COUNTS.map((n) => (
                <option key={n} value={n}>{axis === 'throttle' ? `${+(100 / n).toFixed(1)}% steps` : `${n} zones`}</option>
              ))}
            </select>
            <button onClick={newTarget}>New target</button>
            {target !== null && (
              <span className={inTarget ? 'ok' : 'muted'}>
                {inTarget ? 'In the target zone' : `Target: ${zoneLabel(axis, target, count).split(' → ')[1]}`}
              </span>
            )}
          </>
        )}
      </div>

      <div className="bars">
        {STICK_AXES.map((a) => (
          <AxisBar key={a} label={AXIS_LABEL[a]} value={v[a]} fromBottom={a === 'throttle'} />
        ))}
      </div>
      <p className="muted small">
        Mode {profile.mode} · Raw axes:{' '}
        {STICK_AXES.map((a) => `${AXIS_LABEL[a]} ${profile.axes[a].index}${profile.axes[a].cal.inverted ? ' (inv)' : ''}`).join(', ')}
      </p>
      <div className="actions">
        <button onClick={onRedoSetup}>Redo setup</button>
      </div>
    </section>
  )
}
