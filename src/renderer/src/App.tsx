import { useCallback, useEffect, useState } from 'react'
import { levelById, nextLevel } from '@core/levels'
import type { RadioProfile } from '@core/radio'
import { recordAttempt, scoreLevel, type LevelScore, type Progress } from '@core/scoring'
import type { TargetResult } from '@core/session'
import { LevelSelect } from './levels/LevelSelect'
import { LiveView } from './live/LiveView'
import { PlayView } from './play/PlayView'
import { ResultsView } from './play/ResultsView'
import { loadProfile, saveProfile } from './radio/profileStore'
import { loadProgress, saveProgress } from './radio/progressStore'
import { useGamepad } from './radio/useGamepad'
import { SetupWizard } from './setup/SetupWizard'

type Screen =
  | { name: 'levels' }
  | { name: 'free' }
  | { name: 'play'; levelId: string; attempt: number }
  | { name: 'results'; levelId: string; score: LevelScore }

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

  const finishLevel = useCallback((levelId: string, results: TargetResult[]) => {
    const level = levelById(levelId)!
    const score = scoreLevel(level, results)
    setProgress((p) => {
      const next = recordAttempt(p, levelId, score)
      saveProgress(next)
      return next
    })
    setScreen({ name: 'results', levelId, score })
  }, [])

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
        <span className={`pill ${pad ? 'ok' : 'warn'}`}>{pad ? pad.id.replace(/\s*\(Vendor.*\)$/, '') : 'No radio'}</span>
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
        <PlayView
          key={screen.attempt}
          pad={pad}
          profile={profile}
          level={levelById(screen.levelId)!}
          onFinish={(results) => finishLevel(screen.levelId, results)}
          onQuit={() => setScreen({ name: 'levels' })}
        />
      ) : screen.name === 'results' ? (
        <ResultsView
          level={levelById(screen.levelId)!}
          score={screen.score}
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
