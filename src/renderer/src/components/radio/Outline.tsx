import { ANTENNA_PATH, BODY_INNER_PATH, BODY_PATH, SHOULDER_SWITCH_LEFT, SHOULDER_SWITCH_RIGHT, TOP_TOGGLES } from './geometry'

/** Section 1: silhouette — antenna, top switches, body. */
export function Outline() {
  return (
    <g className="section-outline">
      <path d={ANTENNA_PATH} className="part" />
      {TOP_TOGGLES.map(({ x }) => (
        <g key={x}>
          <rect x={x - 8} y={176} width={16} height={16} rx={3} className="part" />
          <rect x={x - 14} y={172} width={28} height={10} rx={5} className="part" />
        </g>
      ))}
      <path d={BODY_PATH} className="body" />
      <path d={BODY_INNER_PATH} className="detail" />
      <path d={SHOULDER_SWITCH_LEFT} className="part" />
      <path d={SHOULDER_SWITCH_RIGHT} className="part" />
    </g>
  )
}
