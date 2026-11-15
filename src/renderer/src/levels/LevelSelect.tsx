import { LEVELS, STAGES, levelById } from '@core/levels'
import { isUnlocked, type Progress } from '@core/scoring'
import { StarRow } from './format'

interface Props {
  progress: Progress
  onPlay: (levelId: string) => void
}

export function LevelSelect({ progress, onPlay }: Props) {
  return (
    <section className="levels">
      {STAGES.map((stage) => (
        <div key={stage.stage} className="stage">
          <h2>
            Stage {stage.stage} · {stage.title}
          </h2>
          <p className="muted">{stage.blurb}</p>
          <div className="level-grid">
            {LEVELS.filter((l) => l.stage === stage.stage).map((level) => {
              const open = isUnlocked(progress, level.id)
              const rec = progress[level.id]
              return (
                <button key={level.id} className="level-card" disabled={!open} onClick={() => onPlay(level.id)}>
                  <span className="level-id">{level.id}</span>
                  <b>{level.title}</b>
                  <span className="muted small">{level.summary}</span>
                  {!open ? (
                    <span className="muted small">🔒 Pass {unlockedBy(level.id)} to unlock</span>
                  ) : level.kind === 'speed' ? (
                    <span className="small">Best: {rec?.bestSpeed !== undefined ? rec.bestSpeed.toFixed(1) : '—'}</span>
                  ) : (
                    <StarRow stars={rec?.stars ?? 0} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

function unlockedBy(id: string): string {
  const level = levelById(id)!
  if (level.unlockAfter) return level.unlockAfter
  const i = LEVELS.findIndex((l) => l.id === id)
  return LEVELS.slice(0, i).reverse().find((l) => l.kind !== 'speed')?.id ?? ''
}
