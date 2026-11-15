import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'

// App icon (build/icon.png). Packaged builds take theirs from build/icon.icns;
// in development this sets the Dock (macOS) and window (Windows/Linux) icon.
const ICON_PATH = join(app.getAppPath(), 'build', 'icon.png')

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#ffffff',
    title: 'Master the Sticks',
    icon: ICON_PATH,
    // No preload: the radio is read in the page via the Gamepad API,
    // which needs no Node access.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Open external links in the default browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin' && !app.isPackaged) app.dock?.setIcon(ICON_PATH)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
