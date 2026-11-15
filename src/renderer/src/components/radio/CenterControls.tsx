/** Section 3: LCD screen, lanyard loop, trim buttons, power button. */
export function CenterControls() {
  return (
    <g className="section-center">
      {/* Screen bezel: straight sides, tapering into the label area */}
      <path d="M 340 264 Q 335 264 335 269 V 348 L 357 377 H 443 L 465 348 V 269 Q 465 264 460 264 Z" className="part" />
      <rect x={344} y={272} width={112} height={56} rx={3} className="screen" />
      <line x1={337} y1={346} x2={463} y2={346} className="detail" />

      {/* Lanyard loop */}
      <path d="M 377 398 H 423 L 427 410 H 373 Z" className="part" />
      {[388, 400, 412].map((x) => (
        <line key={x} x1={x} y1={399} x2={x} y2={409} className="detail" />
      ))}

      <TrimButton cx={334} cy={430} />
      <TrimButton cx={466} cy={430} />

      {/* Power button */}
      <rect x={372} y={421} width={56} height={24} rx={12} className="part" />
      <path d="M 400 427 V 433 M 394.5 429.5 A 7 7 0 1 0 405.5 429.5" className="detail" />
    </g>
  )
}

/** Trim button: ring with a 4-way cross. */
function TrimButton({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={21} className="part" />
      <circle cx={cx} cy={cy} r={15} className="detail" />
      <path d={`M ${cx - 9} ${cy} H ${cx + 9} M ${cx} ${cy - 9} V ${cy + 9}`} className="detail" />
    </g>
  )
}
