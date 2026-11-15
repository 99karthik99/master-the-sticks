import type { ReactNode } from 'react'

export type CardTone = 'idle' | 'target' | 'ok' | 'bad'

/**
 * The big instruction box above the radio. For targets, the label is split
 * into its parts: "Roll → right 60–100%" becomes a bold axis and a blue goal
 * chip; " · keep … still" notes go on an amber second line; "  +  " joins
 * the two halves of a both-sticks target.
 */
export function InstructionCard({ tone, label, children }: { tone: CardTone; label?: string; children?: ReactNode }) {
  return (
    <div className={`instruction ${tone}`} role="status" aria-live="polite">
      {label ? <TargetLabel label={label} /> : <div className="instruction-main">{children}</div>}
    </div>
  )
}

function TargetLabel({ label }: { label: string }) {
  const notes: string[] = []
  const parts = label.split('  +  ').map((part) => {
    const [main, ...rest] = part.split(' · ')
    notes.push(...rest)
    const [subject, goal] = main!.split(' → ')
    return { subject: subject!, goal }
  })
  return (
    <>
      <div className="instruction-main">
        {parts.map((p, i) => (
          <span key={i} className="instruction-part">
            {i > 0 && <span className="instruction-plus">+</span>}
            <b>{p.subject}</b>
            {p.goal && (
              <>
                <span className="instruction-arrow">→</span>
                <span className="instruction-goal">{p.goal}</span>
              </>
            )}
          </span>
        ))}
      </div>
      {notes.length > 0 && <div className="instruction-note">{notes.join(' · ')}</div>}
    </>
  )
}
