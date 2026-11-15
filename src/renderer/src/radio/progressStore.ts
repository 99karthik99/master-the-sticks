import type { Progress } from '@core/scoring'

// Level progress (stars, best times), kept in the app's localStorage.
const KEY = 'mts.progress.v1'

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Progress) : {}
  } catch {
    return {}
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Storage unavailable: progress lasts for this session only.
  }
}
