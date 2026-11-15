import { useEffect, useRef, useState } from 'react'
import type { SpeedLevel, TargetLevel } from '@core/levels'
import { readSticks, type RadioProfile, type StickAxis } from '@core/radio'
import { pastAxes, startSession, stepSession, type SessionConfig, type SessionState, type TargetResult } from '@core/session'
import { RadioDrawing, type Guide } from '../components/radio/RadioDrawing'
import { InstructionCard } from './InstructionCard'
import { playGo, playHit, playMiss } from '../audio/sounds'
import { seconds } from '../levels/format'
import type { PadSnapshot } from '../radio/useGamepad'

interface Props {
  pad: PadSnapshot
  profile: RadioProfile
  level: TargetLevel | SpeedLevel
  config: SessionConfig
  onFinish: (results: TargetResult[]) => void
  onQuit: () => void
}

const MISS_TEXT: Record<NonNullable<TargetResult['reason']>, string> = {
  timeout: '✗ Missed',
  keep: '✗ Moved an axis that should stay still',
  slow: '✗ Too slow',
}

/** Play screen for reach-and-hold levels (Stages 1–7) and the speed test. */
export function TargetPlay({ pad, profile, level, config, onFinish, onQuit }: Props) {
  const values = readSticks(pad.axes, profile)
  const [session, setSession] = useState<SessionState>(() => startSession(config, pad.t))
  const finished = useRef(false)

  // Advance the session every frame (pad.t changes each animation frame).
  useEffect(() => {
    setSession((s) => stepSession(s, values, pad.t))
  }, [pad.t])

  // Sounds: a blip when targets start, then a tick or buzz for each result.
  const started = session.startedAt !== null
  useEffect(() => {
    if (started) playGo()
  }, [started])
  const resultCount = session.results.length
  useEffect(() => {
    const last = session.results[resultCount - 1]
    if (last) (last.hit ? playHit : playMiss)()
  }, [resultCount])

  // Dev only: lets automated play-tests read the current target.
  if (import.meta.env.DEV) (window as unknown as { __session?: SessionState }).__session = session

  useEffect(() => {
    if (session.phase === 'done' && !finished.current) {
      finished.current = true
      onFinish(session.results)
    }
  }, [session, onFinish])

  const t = session.target
  let guide: Guide | null = null
  if (t) {
    const step = t.spec.steps[t.stepIndex]!
    const toMap = (rs: typeof step.want) => Object.fromEntries(rs.map((r) => [r.axis, { lo: r.lo, hi: r.hi }])) as Guide['target']
    guide = {
      divisions: t.spec.divisions,
      target: toMap(step.want),
      keep: t.spec.keep.length ? (toMap(t.spec.keep) as Partial<Record<StickAxis, { lo: number; hi: number }>>) : undefined,
      pastAxes: pastAxes(t, values),
      holdProgress: t.holdStart !== null && step.holdMs > 0 ? (pad.t - t.holdStart) / step.holdMs : undefined,
    }
  }

  const done = session.results.length
  const hits = session.results.filter((r) => r.hit).length
  const last = session.results[done - 1]
  const isSpeed = level.kind === 'speed'
  const timeLeft = isSpeed && session.startedAt !== null ? Math.max(0, level.durationMs - (pad.t - session.startedAt)) : null

  let card: React.ReactNode
  if (session.phase === 'countdown') card = <InstructionCard tone="idle">Get ready…</InstructionCard>
  else if (t) card = <InstructionCard tone="target" label={t.spec.label} />
  else if (last)
    card = last.hit ? (
      <InstructionCard tone="ok">✓ {seconds(last.timeMs!)}</InstructionCard>
    ) : (
      <InstructionCard tone="bad">{MISS_TEXT[last.reason ?? 'timeout']}</InstructionCard>
    )
  else card = <InstructionCard tone="idle">…</InstructionCard>

  return (
    <section className="play">
      <div className="info-strip">
        <span>
          <b>{level.id}</b> {level.title}
        </span>
        {isSpeed ? (
          <>
            <span>Time {timeLeft === null ? '1:00' : `0:${String(Math.ceil(timeLeft / 1000)).padStart(2, '0')}`}</span>
            <span>Hits {hits}</span>
          </>
        ) : (
          <span>
            Target {Math.min(done + 1, level.targetCount)} / {level.targetCount}
          </span>
        )}
        <span>Accuracy {done ? Math.round((hits / done) * 100) : 100}%</span>
        <button onClick={onQuit}>Quit</button>
      </div>
      {card}
      <RadioDrawing mode={profile.mode} values={values} guide={guide} />
    </section>
  )
}
