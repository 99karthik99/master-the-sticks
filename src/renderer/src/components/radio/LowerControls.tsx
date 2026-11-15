/** Section 4: button stack + SYS (left), MDL + menu wheel (right), speaker, bottom slot. */
export function LowerControls() {
  return (
    <g className="section-lower">
      {/* Side panels framing the button groups, as on the real radio */}
      <path d="M 218 432 Q 218 424 228 424 L 268 424 Q 280 424 290 432 L 330 470 Q 340 482 332 500 L 300 540 Q 290 550 276 550 H 228 Q 218 550 218 540 Z" className="detail" />
      <path d="M 582 432 Q 582 424 572 424 L 532 424 Q 520 424 510 432 L 470 470 Q 460 482 468 500 L 500 540 Q 510 550 524 550 H 572 Q 582 550 582 540 Z" className="detail" />

      {/* Left: RTN / PAGE> / PAGE< / TELE stack and SYS */}
      {[434, 462, 490, 518].map((y) => (
        <rect key={y} x={228} y={y} width={40} height={16} rx={8} className="part" />
      ))}
      <RoundButton cx={308} cy={491} />

      {/* Right: MDL and the menu wheel */}
      <RoundButton cx={492} cy={491} />
      <rect x={530} y={432} width={40} height={108} rx={16} className="part" />
      {[448, 460, 472, 484, 496, 508, 520].map((y) => (
        <line key={y} x1={536} y1={y} x2={564} y2={y} className="detail" />
      ))}

      {/* Speaker grille */}
      {[
        { y: 475, n: 5 },
        { y: 500, n: 7 },
        { y: 525, n: 5 },
      ].map(({ y, n }) =>
        Array.from({ length: n }, (_, i) => (
          <circle key={`${y}-${i}`} cx={400 + (i - (n - 1) / 2) * 11} cy={y} r={2.6} className="dot" />
        )),
      )}

      {/* Bottom edge slot */}
      <rect x={340} y={566} width={120} height={7} rx={3} className="part" />
    </g>
  )
}

function RoundButton({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={20} className="part" />
      <circle cx={cx} cy={cy} r={15} className="detail" />
    </g>
  )
}
