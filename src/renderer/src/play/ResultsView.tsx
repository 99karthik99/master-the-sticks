import type { ZoneLevel } from '@core/levels'
import type { LevelScore } from '@core/scoring'
import { seconds, StarRow } from '../levels/format'

interface Props {
  level: ZoneLevel
  score: LevelScore
  hasNext: boolean
  onRetry: () => void
  onNext: () => void
  onLevels: () => void
}

export function ResultsView({ level, score, hasNext, onRetry, onNext, onLevels }: Props) {
  const accuracyOk = score.accuracy >= 0.9
  const timeOk = score.medianMs !== null && score.medianMs <= level.limitMs
  return (
    <section className="panel results">
      <h2>
        {level.id} {level.title} — {score.passed ? 'Passed' : 'Not yet'}
      </h2>
      <StarRow stars={score.stars} />
      <dl className="result-grid">
        <dt>Accuracy</dt>
        <dd className={accuracyOk ? 'ok' : 'bad'}>
          {Math.round(score.accuracy * 100)}% <span className="muted">({score.hits}/{score.total}, need 90%)</span>
        </dd>
        <dt>Median time</dt>
        <dd className={timeOk ? 'ok' : 'bad'}>
          {score.medianMs === null ? '—' : seconds(score.medianMs)}{' '}
          <span className="muted">(need under {seconds(level.limitMs)})</span>
        </dd>
        <dt>Overshoots</dt>
        <dd>{score.overshoots}</dd>
      </dl>
      {score.passed && score.stars < 3 && (
        <p className="muted small">
          ★★ at {seconds(0.8 * level.limitMs)} · ★★★ at {seconds(0.6 * level.limitMs)} with 97% accuracy
        </p>
      )}
      <div className="actions">
        <button onClick={onLevels}>All levels</button>
        <button onClick={onRetry}>Retry</button>
        {score.passed && hasNext && (
          <button className="primary" onClick={onNext}>
            Next level
          </button>
        )}
      </div>
    </section>
  )
}
