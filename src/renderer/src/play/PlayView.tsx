import { useEffect, useRef, useState } from 'react'
import { zoneOf } from '@core/axis'
import type { ZoneLevel } from '@core/levels'
import { readSticks, type RadioProfile } from '@core/radio'
import { isPast, startSession, stepSession, type SessionState, type TargetResult } from '@core/session'
import { AXIS_LABEL } from '../components/labels'
import { RadioDrawing, type ZoneOverlay } from '../components/radio/RadioDrawing'
import { seconds } from '../levels/format'
import type { PadSnapshot } from '../radio/useGamepad'

interface Props {
  pad: PadSnapshot
  profile: RadioProfile
  level: ZoneLevel
  onFinish: (results: TargetResult[]) => void
  onQuit: () => void
}

export function PlayView({ pad, profile, level, onFinish, onQuit }: Props) {
  const values = readSticks(pad.axes, profile)
  const [session, setSession] = useState<SessionState>(() => startSession(level, pad.t))
  const finished = useRef(false)

  // Advance the session every frame.
  useEffect(() => {
    setSession((s) => stepSession(s, values, pad.t))
    // Keyed on the frame time: this is the per-frame update.
  }, [pad.t])

  useEffect(() => {
    if (session.phase === 'done' && !finished.current) {
      finished.current = true
      onFinish(session.results)
    }
  }, [session, onFinish])

  const t = session.target
  let zones: ZoneOverlay | null = null
  if (t) {
    const current = zoneOf(values[t.axis], t.count)
    zones = {
      axis: t.axis,
      count: t.count,
      target: t.zone,
      current,
      overshoot: isPast(t.startZone, t.zone, current),
      holdProgress: t.holdStart !== null ? (pad.t - t.holdStart) / level.holdMs : undefined,
    }
  }

  const done = session.results.length
  const hits = session.results.filter((r) => r.hit).length
  const last = session.results[done - 1]

  let prompt: React.ReactNode
  if (session.phase === 'countdown') prompt = <span className="muted">Get ready…</span>
  else if (t)
    prompt = (
      <>
        <b>{AXIS_LABEL[t.axis]}</b> → zone {t.zone + 1} of {t.count}
      </>
    )
  else if (last) prompt = last.hit ? <span className="ok">✓ {seconds(last.timeMs!)}</span> : <span className="bad">✗ Missed</span>

  return (
    <section className="play">
      <div className="info-strip">
        <span>
          <b>{level.id}</b> {level.title}
        </span>
        <span>
          Target {Math.min(done + 1, level.targetCount)} / {level.targetCount}
        </span>
        <span>Accuracy {done ? Math.round((hits / done) * 100) : 100}%</span>
        <button onClick={onQuit}>Quit</button>
      </div>
      <p className="play-prompt">{prompt}</p>
      <RadioDrawing mode={profile.mode} values={values} zones={zones} />
    </section>
  )
}
