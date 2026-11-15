import { describe, expect, it } from 'vitest'
import { scoreTrack } from './scoring'
import { startTrack, stepTrack, TRACK_COUNTDOWN_MS, trackTargets, type TrackConfig } from './track'

const config: TrackConfig = { paths: { throttle: () => 0 }, durationMs: 1000, tolerance: 0.15 }
const rest = { throttle: 0, yaw: 0, pitch: 0, roll: 0 }

function run(offAfterMs: number) {
  let s = startTrack(config, 0)
  s = stepTrack(s, rest, TRACK_COUNTDOWN_MS) // starts running
  for (let t = TRACK_COUNTDOWN_MS + 10; s.phase !== 'done'; t += 10) {
    const off = t - TRACK_COUNTDOWN_MS > offAfterMs
    s = stepTrack(s, { ...rest, throttle: off ? 0.5 : 0.05 }, t)
  }
  return s
}

describe('tracking', () => {
  it('measures share of time on target and average error', () => {
    const s = run(1000)
    const score = scoreTrack(s)
    expect(score.accuracy).toBeCloseTo(1)
    expect(score.stars).toBe(3)
    expect(score.meanErrorPct).toBeCloseTo(2.5)
  })

  it('drops stars as time off target grows', () => {
    expect(scoreTrack(run(850)).stars).toBe(1) // ~85% on target
    expect(scoreTrack(run(500)).passed).toBe(false)
  })

  it('shows the path start during the countdown', () => {
    const s = startTrack({ ...config, paths: { roll: (t) => t } }, 0)
    expect(trackTargets(s, 999)).toEqual({ roll: 0 })
  })
})
