import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

export interface Settings {
  theme: Theme
  sound: boolean
}

// App-wide preferences, kept in the app's localStorage.
const KEY = 'mts.settings.v1'

function initial(): Settings {
  const systemDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
  const fallback: Settings = { theme: systemDark ? 'dark' : 'light', sound: true }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Settings> | null
    return {
      theme: saved?.theme === 'dark' || saved?.theme === 'light' ? saved.theme : fallback.theme,
      sound: typeof saved?.sound === 'boolean' ? saved.sound : fallback.sound,
    }
  } catch {
    return fallback
  }
}

let state = initial()
const listeners = new Set<() => void>()

/** Put the theme on <html data-theme="…"> so the CSS tokens switch. */
export function applyTheme(theme: Theme = state.theme): void {
  document.documentElement.dataset.theme = theme
}

export const getSettings = () => state

export function updateSettings(patch: Partial<Settings>): void {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable: the choice lasts for this session.
  }
  if (patch.theme) applyTheme(patch.theme)
  listeners.forEach((l) => l())
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
