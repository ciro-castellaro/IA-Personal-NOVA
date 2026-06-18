require('dotenv').config()
const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu } = require('electron')
const path = require('path')

const aiIPC = require('./ipc/ai.ipc')
const memoryIPC = require('./ipc/memory.ipc')

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    frame: false,          // Barra de título personalizada
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // Seguridad: renderer no accede a Node.js directo
      nodeIntegration: false,
    },
    show: false,           // Espera a que cargue para mostrar (evita flash blanco)
    icon: path.join(__dirname, '../renderer/assets/icon.png'),
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Mostrar ventana cuando el contenido esté listo
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // En dev, abrir DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── Tray (icono en barra de tareas) ───────────────────────────────────────────
function createTray() {
  // Usamos un ícono placeholder; reemplazar con el PNG real de NOVA
  const iconPath = path.join(__dirname, '../renderer/assets/tray-icon.png')
  try {
    tray = new Tray(iconPath)
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Abrir NOVA', click: () => mainWindow?.show() },
      { type: 'separator' },
      { label: 'Salir', click: () => app.quit() },
    ])
    tray.setToolTip('NOVA — Asistente personal')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
      }
    })
  } catch {
    // Si no hay ícono todavía, el tray es opcional — no rompe la app
  }
}

// ── Registro de handlers IPC ──────────────────────────────────────────────────
function registerIPC() {
  aiIPC.register(ipcMain, mainWindow)
  memoryIPC.register(ipcMain)

  // Control de ventana desde el renderer (botones de la titlebar custom)
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.hide()) // Ocultar, no cerrar
}

// ── Ciclo de vida de la app ───────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
  registerIPC()

  // Shortcut global para abrir/ocultar NOVA desde cualquier app
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })
})

app.on('window-all-closed', (e) => {
  e.preventDefault() // Mantener la app viva en el tray
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})
