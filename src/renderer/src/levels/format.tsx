
export const seconds = (ms: number) => `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`

export function StarRow({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${stars} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < stars ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}
