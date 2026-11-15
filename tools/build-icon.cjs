// Regenerate the app icon from build/icon.svg:
//   build/icon.png  (1024×1024, transparent) — window icon, Linux/Windows packaging
//   build/icon.icns (macOS)                   — app bundle / Dock
// Run with: npm run icon   (uses Electron's offscreen renderer; .icns needs macOS sips + iconutil)
const { app, BrowserWindow } = require('electron')
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'build', 'icon.svg')
const pngPath = path.join(root, 'build', 'icon.png')
const icnsPath = path.join(root, 'build', 'icon.icns')
const SIZE = 1024

app.disableHardwareAcceleration()
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: SIZE, height: SIZE, show: false, transparent: true, frame: false, webPreferences: { offscreen: true } })
  const html = `<html><body style="margin:0;background:transparent">${fs.readFileSync(svgPath, 'utf8')}</body></html>`
  await win.loadURL('data:text/html;base64,' + Buffer.from(html).toString('base64'))
  await new Promise((r) => setTimeout(r, 500))
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE })
  fs.writeFileSync(pngPath, img.resize({ width: SIZE, height: SIZE }).toPNG())
  console.log('wrote', path.relative(root, pngPath))

  if (process.platform === 'darwin') {
    const set = fs.mkdtempSync(path.join(os.tmpdir(), 'icon-')) + '/icon.iconset'
    fs.mkdirSync(set)
    for (const s of [16, 32, 128, 256, 512]) {
      execFileSync('sips', ['-z', `${s}`, `${s}`, pngPath, '--out', `${set}/icon_${s}x${s}.png`], { stdio: 'ignore' })
      execFileSync('sips', ['-z', `${2 * s}`, `${2 * s}`, pngPath, '--out', `${set}/icon_${s}x${s}@2x.png`], { stdio: 'ignore' })
    }
    execFileSync('iconutil', ['-c', 'icns', set, '-o', icnsPath])
    console.log('wrote', path.relative(root, icnsPath))
  }
  app.quit()
})
