import { useEffect, useState } from 'react'
import type { RadioProfile } from '@core/radio'
import { LiveView } from './live/LiveView'
import { loadProfile, saveProfile } from './radio/profileStore'
import { useGamepad } from './radio/useGamepad'
import { SetupWizard } from './setup/SetupWizard'

export function App() {
  const pad = useGamepad()
  const padId = pad?.id ?? null
  const [profile, setProfile] = useState<RadioProfile | null>(null)
  const [redoing, setRedoing] = useState(false)

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

  return (
    <main className="app">
      <header className="app-head">
        <h1>Master the Sticks</h1>
        <span className={`pill ${pad ? 'ok' : 'warn'}`}>
          {pad ? pad.id.replace(/\s*\(Vendor.*\)$/, '') : 'No radio'}
        </span>
      </header>

      {!pad ? (
        <div className="panel waiting">
          <p className="prompt">Waiting for your radio…</p>
          <ol className="muted">
            <li>Connect the radio by USB and choose <b>USB Joystick (HID)</b> on it.</li>
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
      ) : (
        <LiveView pad={pad} profile={profile} onRedoSetup={() => setRedoing(true)} />
      )}
    </main>
  )
}
