import { useCallback, useEffect, useState } from 'react'
import { levelById, nextLevel, speedTestGen, timeoutMs, type Level } from '@core/levels'
import type { RadioProfile } from '@core/radio'
import { isUnlocked, recordAttempt, scoreSpeed, scoreTargets, scoreTrack, type LevelScore, type Progress } from '@core/scoring'
import type { SessionConfig, TargetResult } from '@core/session'
import type { TrackState } from '@core/track'
import { LevelSelect } from './levels/LevelSelect'
import { LiveView } from './live/LiveView'
import { ResultsView } from './play/ResultsView'
import { TargetPlay } from './play/TargetPlay'
import { TrackPlay } from './play/TrackPlay'
import { loadProfile, saveProfile } from './radio/profileStore'
import { loadProgress, saveProgress } from './radio/progressStore'
import { useGamepad } from './radio/useGamepad'
import { SetupWizard } from './setup/SetupWizard'
import { HeaderToggles } from './settings/HeaderToggles'
import { playFail, playPass } from './audio/sounds'

type Screen =
  | { name: 'levels' }
  | { name: 'free' }
  | { name: 'play'; levelId: string; attempt: number }
  | { name: 'results'; levelId: string; score: LevelScore; best?: number }

export function App() {
  const pad = useGamepad()
  const padId = pad?.id ?? null
  const [profile, setProfile] = useState<RadioProfile | null>(null)
  const [redoing, setRedoing] = useState(false)
  const [screen, setScreen] = useState<Screen>({ name: 'levels' })
  const [progress, setProgress] = useState<Progress>(loadProgress)

  // Load the saved setup whenever a different radio appears.
  useEffect(() => {
    setProfile(padId ? loadProfile(padId) : null)
    setRedoing(false)
  }, [padId])

  const finishSetup = (p: RadioProfile) => {
    saveProfile(p)
    setProfile(p)
    setRedoing(false)
  }

  const play = (levelId: string) => setScreen({ name: 'play', levelId, attempt: Date.now() })

  const finishLevel = useCallback((levelId: string, score: LevelScore) => {
    if (score.passed) playPass()
    else playFail()
    setProgress((p) => {
      const best = p[levelId]?.bestSpeed
      const next = recordAttempt(p, levelId, score)
      saveProgress(next)
      setScreen({ name: 'results', levelId, score, best })
      return next
    })
  }, [])

  const playScreen = (level: Level, attempt: number) => {
    if (!pad || !profile) return null
    const quit = () => setScreen({ name: 'levels' })
    if (level.kind === 'track') {
      return <TrackPlay key={attempt} pad={pad} profile={profile} level={level} onFinish={(st: TrackState) => finishLevel(level.id, scoreTrack(st))} onQuit={quit} />
    }
    const config: SessionConfig =
      level.kind === 'speed'
        ? { gen: speedTestGen((id) => isUnlocked(progress, id)), mode: profile.mode, durationMs: level.durationMs, timeoutMs: 4000 }
        : { gen: level.gen, mode: profile.mode, targetCount: level.targetCount, timeoutMs: timeoutMs(level.limitMs) }
    const finish = (results: TargetResult[]) =>
      finishLevel(level.id, level.kind === 'speed' ? scoreSpeed(level, results) : scoreTargets(level, results))
    return <TargetPlay key={attempt} pad={pad} profile={profile} level={level} config={config} onFinish={finish} onQuit={quit} />
  }

  const ready = pad && profile && !redoing

  return (
    <main className="app">
      <header className="app-head">
        <h1>Master the Sticks</h1>
        {ready && screen.name !== 'play' && (
          <nav className="tabs">
            <button className={screen.name === 'levels' || screen.name === 'results' ? 'active' : ''} onClick={() => setScreen({ name: 'levels' })}>
              Levels
            </button>
            <button className={screen.name === 'free' ? 'active' : ''} onClick={() => setScreen({ name: 'free' })}>
              Free play
            </button>
          </nav>
        )}
        <div className="head-right">
          <span className={`pill ${pad ? 'ok' : 'warn'}`}>{pad ? pad.id.replace(/\s*\(Vendor.*\)$/, '') : 'No radio'}</span>
          <HeaderToggles />
        </div>
      </header>

      {!pad ? (
        <div className="panel waiting">
          <p className="prompt">Waiting for your radio…</p>
          <ol className="muted">
            <li>
              Connect the radio by USB and choose <b>USB Joystick (HID)</b> on it.
            </li>
            <li>Move a stick or flip a switch so the app can see it.</li>
          </ol>
        </div>
      ) : !profile || redoing ? (
        <SetupWizard
          key={redoing ? 'redo' : 'first'}
          pad={pad}
          initialMode={profile?.mode ?? 2}
          onDone={finishSetup}
          onCancel={profile ? () => setRedoing(false) : undefined}
        />
      ) : screen.name === 'play' ? (
        playScreen(levelById(screen.levelId)!, screen.attempt)
      ) : screen.name === 'results' ? (
        <ResultsView
          level={levelById(screen.levelId)!}
          score={screen.score}
          best={screen.best}
          hasNext={!!nextLevel(screen.levelId)}
          onRetry={() => play(screen.levelId)}
          onNext={() => play(nextLevel(screen.levelId)!.id)}
          onLevels={() => setScreen({ name: 'levels' })}
        />
      ) : screen.name === 'free' ? (
        <LiveView pad={pad} profile={profile} onRedoSetup={() => setRedoing(true)} />
      ) : (
        <LevelSelect progress={progress} onPlay={play} />
      )}
    </main>
  )
}
