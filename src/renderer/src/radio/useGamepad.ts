import { useEffect, useState } from 'react'

export interface PadSnapshot {
  id: string
  axes: readonly number[]
  /** performance.now() of this frame. Advances every frame, even when the sticks are still. */
  t: number
}

/**
 * Reads the first connected gamepad once per animation frame (~60 Hz).
 * Returns null while no controller is visible. Chrome only exposes a
 * controller after it has been used (a stick moved or a switch flipped).
 */
export function useGamepad(): PadSnapshot | null {
  const [snap, setSnap] = useState<PadSnapshot | null>(null)

  useEffect(() => {
    let raf = 0
    let hadPad = false
    const loop = (t: number) => {
      const pad = navigator.getGamepads().find((p) => p?.connected) ?? null
      if (pad) {
        hadPad = true
        setSnap({ id: pad.id, axes: [...pad.axes], t })
      } else if (hadPad) {
        hadPad = false
        setSnap(null)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return snap
}
