import { updateSettings, useSettings } from './settings'

/** Theme and sound switches for the top-right corner. */
export function HeaderToggles() {
  const { theme, sound } = useSettings()
  const dark = theme === 'dark'
  return (
    <>
      <button
        className="icon-btn"
        onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>
      <button
        className={`icon-btn${sound ? '' : ' off'}`}
        onClick={() => updateSettings({ sound: !sound })}
        title={sound ? 'Sound on — click to mute' : 'Sound off — click to turn on'}
        aria-label={sound ? 'Mute sound' : 'Turn sound on'}
        aria-pressed={sound}
      >
        {sound ? <SpeakerIcon /> : <SpeakerOffIcon />}
      </button>
    </>
  )
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
  </svg>
)
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
  </svg>
)
const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
  </svg>
)
const SpeakerOffIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
)
