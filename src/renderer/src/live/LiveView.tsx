import { readSticks, stickLayout, STICK_AXES, type RadioProfile } from '@core/radio'
import { AxisBar } from '../components/AxisBar'
import { StickBox } from '../components/StickBox'
import { AXIS_LABEL } from '../components/labels'
import type { PadSnapshot } from '../radio/useGamepad'

interface Props {
  pad: PadSnapshot
  profile: RadioProfile
  onRedoSetup: () => void
}

/** Milestone 1 screen: all four sticks, live and calibrated. */
export function LiveView({ pad, profile, onRedoSetup }: Props) {
  const v = readSticks(pad.axes, profile)
  const { left, right } = stickLayout(profile.mode)

  return (
    <section className="live">
      <div className="sticks">
        <StickBox title="Left stick" side={left} x={v[left.x]} y={v[left.y]} />
        <StickBox title="Right stick" side={right} x={v[right.x]} y={v[right.y]} />
      </div>
      <div className="bars">
        {STICK_AXES.map((axis) => (
          <AxisBar key={axis} label={AXIS_LABEL[axis]} value={v[axis]} fromBottom={axis === 'throttle'} />
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
