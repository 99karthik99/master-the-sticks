import type { Level } from '@core/levels'
import type { LevelScore } from '@core/scoring'
import { TRACK_STARS } from '@core/scoring'
import { seconds, StarRow } from '../levels/format'

interface Props {
  level: Level
  score: LevelScore
  best?: number
  hasNext: boolean
  onRetry: () => void
  onNext: () => void
  onLevels: () => void
}

const pct = (x: number) => `${Math.round(x * 100)}%`

export function ResultsView({ level, score, best, hasNext, onRetry, onNext, onLevels }: Props) {
  return (
    <section className="panel results">
      <h2>
        {level.id} {level.title}
        {level.kind !== 'speed' && <> — {score.passed ? 'Passed' : 'Not yet'}</>}
      </h2>
      {level.kind !== 'speed' && <StarRow stars={score.stars} />}

      <dl className="result-grid">
        {level.kind === 'target' && (
          <>
            <dt>Accuracy</dt>
            <dd className={score.accuracy >= 0.9 ? 'ok' : 'bad'}>
              {pct(score.accuracy)} <span className="muted">({score.hits}/{score.total}, need 90%)</span>
            </dd>
            <dt>{level.stage === 7 ? 'Median flick' : 'Median time'}</dt>
            <dd className={score.medianMs != null && score.medianMs <= level.limitMs ? 'ok' : 'bad'}>
              {score.medianMs == null ? '—' : seconds(score.medianMs)} <span className="muted">(need under {seconds(level.limitMs)})</span>
            </dd>
            <dt>Overshoots</dt>
            <dd>{score.overshoots}</dd>
            {!!score.keepMisses && (
              <>
                <dt>Drifted</dt>
                <dd className="bad">{score.keepMisses} × moved an axis that should stay still</dd>
              </>
            )}
            {!!score.slowMisses && (
              <>
                <dt>Too slow</dt>
                <dd className="bad">{score.slowMisses} × outside the window</dd>
              </>
            )}
          </>
        )}
        {level.kind === 'track' && (
          <>
            <dt>On target</dt>
            <dd className={score.passed ? 'ok' : 'bad'}>
              {pct(score.accuracy)} <span className="muted">(need {pct(TRACK_STARS[0])})</span>
            </dd>
            <dt>Average distance</dt>
            <dd>{score.meanErrorPct!.toFixed(1)}% of stick travel</dd>
          </>
        )}
        {level.kind === 'speed' && (
          <>
            <dt>Score</dt>
            <dd>
              <b className="big">{score.speed!.toFixed(1)}</b> <span className="muted">targets/min × accuracy</span>
            </dd>
            <dt>Personal best</dt>
            <dd>
              {best === undefined || score.speed! > best ? (
                <span className="ok">🎉 New best{best !== undefined ? ` (was ${best.toFixed(1)})` : ''}</span>
              ) : (
                best.toFixed(1)
              )}
            </dd>
            <dt>Hits</dt>
            <dd>
              {score.hits} of {score.total} · {pct(score.accuracy)} · {score.hitsPerMinute!.toFixed(0)}/min
            </dd>
            <dt>Median time</dt>
            <dd>{score.medianMs == null ? '—' : seconds(score.medianMs)}</dd>
          </>
        )}
      </dl>

      {level.kind === 'target' && score.passed && score.stars < 3 && (
        <p className="muted small">
          ★★ at {seconds(0.8 * level.limitMs)} · ★★★ at {seconds(0.6 * level.limitMs)} with 97% accuracy
        </p>
      )}
      {level.kind === 'track' && score.stars < 3 && (
        <p className="muted small">
          ★★ at {pct(TRACK_STARS[1])} on target · ★★★ at {pct(TRACK_STARS[2])}
        </p>
      )}

      <div className="actions">
        <button onClick={onLevels}>All levels</button>
        <button onClick={onRetry}>{level.kind === 'speed' ? 'Go again' : 'Retry'}</button>
        {score.passed && hasNext && (
          <button className="primary" onClick={onNext}>
            Next level
          </button>
        )}
      </div>
    </section>
  )
}
