import type { ZoneLevel } from '@core/levels'
import type { StickAxis } from '@core/radio'
import { AXIS_LABEL } from '../components/labels'

export const seconds = (ms: number) => `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`

export function zonesSummary(level: ZoneLevel): string {
  const counts = new Set(Object.values(level.zones))
  const axes = Object.keys(level.zones) as StickAxis[]
  if (counts.size === 1) return `${[...counts][0]} zones`
  return axes.map((a) => `${AXIS_LABEL[a]} ${level.zones[a]}`).join(' · ')
}

export function StarRow({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${stars} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < stars ? 'on' : ''}>★</span>
      ))}
    </span>
  )
}
