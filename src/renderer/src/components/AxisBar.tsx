interface Props {
  label: string
  value: number // -1..1
  /** Throttle: show 0–100% filled from the left. Others: filled from the center. */
  fromBottom?: boolean
}

export function AxisBar({ label, value, fromBottom = false }: Props) {
  const pct = ((value + 1) / 2) * 100
  const style = fromBottom
    ? { left: '0%', width: `${pct}%` }
    : { left: `${Math.min(50, pct)}%`, width: `${Math.abs(pct - 50)}%` }
  const readout = fromBottom ? `${Math.round(pct)}%` : `${value >= 0 ? '+' : ''}${Math.round(value * 100)}`
  return (
    <div className="axisbar">
      <span className="name">{label}</span>
      <div className="track">
        {!fromBottom && <div className="mid" />}
        <div className="fill" style={style} />
      </div>
      <span className="value">{readout}</span>
    </div>
  )
}
