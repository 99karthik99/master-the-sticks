import { LEVELS, STAGES } from '@core/levels'
import { isUnlocked, type Progress } from '@core/scoring'
import { seconds, StarRow, zonesSummary } from './format'

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
                  <span className="muted small">
                    {zonesSummary(level)} · hold {seconds(level.holdMs)} · under {seconds(level.limitMs)}
                  </span>
                  {open ? <StarRow stars={rec?.stars ?? 0} /> : <span className="muted small">🔒 Pass {prevId(level.id)} to unlock</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

const prevId = (id: string) => {
  const i = LEVELS.findIndex((l) => l.id === id)
  return LEVELS[i - 1]?.id ?? ''
}
