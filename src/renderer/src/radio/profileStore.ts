import { isValidProfile, type RadioProfile } from '@core/radio'

// Stored in the app's localStorage (kept by Electron in its user-data folder).
const key = (gamepadId: string) => `mts.radioProfile.v1:${gamepadId}`

export function loadProfile(gamepadId: string): RadioProfile | null {
  try {
    const raw = localStorage.getItem(key(gamepadId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidProfile(parsed) && parsed.gamepadId === gamepadId ? parsed : null
  } catch {
    return null
  }
}

export function saveProfile(profile: RadioProfile): void {
  try {
    localStorage.setItem(key(profile.gamepadId), JSON.stringify(profile))
  } catch {
    // Storage unavailable: the profile still works for this session.
  }
}
