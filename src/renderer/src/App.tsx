import { useEffect, useState } from 'react'

/** Placeholder screen: proves the app window runs and can see the radio. */
export function App() {
  const [radio, setRadio] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      const pad = navigator.getGamepads().find((p) => p !== null)
      setRadio(pad ? pad.id : null)
    }
    window.addEventListener('gamepadconnected', update)
    window.addEventListener('gamepaddisconnected', update)
    update()
    return () => {
      window.removeEventListener('gamepadconnected', update)
      window.removeEventListener('gamepaddisconnected', update)
    }
  }, [])

  return (
    <main className="app">
      <h1>Master the Sticks</h1>
      <p className="muted">Learn your radio's sticks the way you learn typing.</p>
      <div className={`status ${radio ? 'ok' : 'warn'}`}>
        {radio
          ? `Radio connected: ${radio}`
          : 'Waiting for radio… connect it in USB Joystick mode and move a stick.'}
      </div>
    </main>
  )
}
