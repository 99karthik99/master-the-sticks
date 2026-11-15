/**
 * Sound effects, synthesized with the Web Audio API (no audio files).
 * Every function is a no-op while sound is turned off in settings.
 */
import { getSettings } from '../settings/settings'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (!getSettings().sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface Tone {
  freq: number
  /** Seconds. */
  dur: number
  type?: OscillatorType
  gain?: number
  /** Seconds after now. */
  at?: number
  /** Glide to this frequency over the tone. */
  to?: number
}

function play(tones: Tone[]): void {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  for (const { freq, dur, type = 'sine', gain = 0.2, at = 0, to } of tones) {
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    const t0 = now + at
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
    // Quick attack, smooth decay: no clicks.
    amp.gain.setValueAtTime(0.0001, t0)
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(amp).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }
}

/** First target appears / tracking starts. */
export const playGo = () => play([{ freq: 660, dur: 0.09, gain: 0.16 }])

/** Target hit: a bright two-note tick. */
export const playHit = () =>
  play([
    { freq: 880, dur: 0.07, gain: 0.18 },
    { freq: 1320, dur: 0.1, gain: 0.15, at: 0.045 },
  ])

/** Target missed: a short, soft low buzz. */
export const playMiss = () => play([{ freq: 220, dur: 0.2, type: 'triangle', gain: 0.22, to: 150 }])

/** Level passed: rising arpeggio. */
export const playPass = () =>
  play([523, 659, 784, 1047].map((freq, i) => ({ freq, dur: 0.16, type: 'triangle' as const, gain: 0.16, at: i * 0.09 })))

/** Level not passed: falling three notes. */
export const playFail = () =>
  play([392, 330, 262].map((freq, i) => ({ freq, dur: 0.2, type: 'triangle' as const, gain: 0.16, at: i * 0.12 })))
