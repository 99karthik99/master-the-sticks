import { useEffect, useRef, useState } from 'react'
import type { TrackLevel } from '@core/levels'
import { readSticks, type RadioProfile } from '@core/radio'
import { startTrack, stepTrack, trackError, trackTargets, type TrackState } from '@core/track'
import { RadioDrawing } from '../components/radio/RadioDrawing'
import { InstructionCard } from './InstructionCard'
import type { PadSnapshot } from '../radio/useGamepad'

interface Props {
  pad: PadSnapshot
  profile: RadioProfile
  level: TrackLevel
  onFinish: (state: TrackState) => void
  onQuit: () => void
}

/** Play screen for tracking levels (Stage 8). */
export function TrackPlay({ pad, profile, level, onFinish, onQuit }: Props) {
  const values = readSticks(pad.axes, profile)
  const [state, setState] = useState<TrackState>(() => startTrack(level.track, pad.t))
  const finished = useRef(false)

  useEffect(() => {
    setState((s) => stepTrack(s, values, pad.t))
  }, [pad.t])

  useEffect(() => {
    if (state.phase === 'done' && !finished.current) {
      finished.current = true
      onFinish(state)
    }
  }, [state, onFinish])

  // Dev only: lets automated play-tests read the moving target.
  if (import.meta.env.DEV) (window as unknown as { __track?: unknown }).__track = { state, targets: trackTargets(state, pad.t) }

  const onNow = trackError(state, values, pad.t) <= level.track.tolerance
  const timeLeft = state.phase === 'running' ? Math.max(0, level.track.durationMs - (pad.t - state.phaseStart)) : level.track.durationMs
  const share = state.elapsed ? Math.round((state.onTarget / state.elapsed) * 100) : 100

  return (
    <section className="play">
      <div className="info-strip">
        <span>
          <b>{level.id}</b> {level.title}
        </span>
        <span>Time 0:{String(Math.ceil(timeLeft / 1000)).padStart(2, '0')}</span>
        <span>On target {share}%</span>
        <button onClick={onQuit}>Quit</button>
      </div>
      {state.phase === 'countdown' ? (
        <InstructionCard tone="idle">Line up with the blue ring…</InstructionCard>
      ) : onNow ? (
        <InstructionCard tone="ok">On target — keep following</InstructionCard>
      ) : (
        <InstructionCard tone="target">Follow the blue ring</InstructionCard>
      )}
      <RadioDrawing mode={profile.mode} values={values} guide={{ ghost: trackTargets(state, pad.t), ghostTolerance: level.track.tolerance }} />
    </section>
  )
}
