/**
 * Dev-only page (not part of the app build): overlays a reference image on the
 * radio drawing to check proportions section by section.
 * Open <dev server>/compare.html?ref=<image URL>
 */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RadioDrawing, type Section } from './components/radio/RadioDrawing'
import './styles.css'

const SECTIONS: Section[] = ['outline', 'gimbals', 'center', 'lower']
const ZERO = { throttle: 0, yaw: 0, pitch: 0, roll: 0 }

function Compare() {
  const ref = new URLSearchParams(location.search).get('ref') ?? ''
  const [opacity, setOpacity] = useState(0.5)
  const [shown, setShown] = useState<Section[]>(SECTIONS)
  const toggle = (s: Section) => setShown((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  return (
    <main className="app compare">
      <div className="zone-preview">
        <label>
          Reference opacity <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
        </label>
        {SECTIONS.map((s) => (
          <label key={s}>
            <input type="checkbox" checked={shown.includes(s)} onChange={() => toggle(s)} /> {s}
          </label>
        ))}
      </div>
      <RadioDrawing mode={2} values={ZERO} sections={shown} underlay={ref ? { href: ref, opacity } : null} />
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Compare />
  </StrictMode>,
)
