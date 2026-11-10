import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { initDatabase, closeDb } from './database'
import {
  registerAuthHandlers,
  registerCategoriaHandlers,
  registerProductoHandlers,
  registerVentaHandlers,
  registerReporteHandlers,
  registerImpresionHandlers,
  registerConfiguracionHandlers,
  registerSyncHandlers
} from './ipc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  let preloadPath: string

  // Ruta absoluta confiable para el preload
  const projectRoot = path.resolve(__dirname, '../..')
  preloadPath = path.join(projectRoot, 'dist-electron/preload/index.js')

  console.log('__dirname:', __dirname)
  console.log('projectRoot:', projectRoot)
  console.log('VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL)
  console.log('Preload Path:', preloadPath)
  console.log('Preload exists:', existsSync(preloadPath))

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: 'MiniPOS',
    show: false
  })

  // Manejo de errores del preload
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error(`✗ Error en preload (${preloadPath}):`, error)
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    const projectRoot = path.resolve(__dirname, '../..')
    win.loadFile(path.join(projectRoot, 'dist/index.html'))
  }
}

app.whenReady().then(() => {
  console.log('Inicializando MiniPOS...')
  
  registerAuthHandlers()
  registerCategoriaHandlers()
  registerProductoHandlers()
  registerVentaHandlers()
  registerReporteHandlers()
  registerImpresionHandlers()
  registerConfiguracionHandlers()
  registerSyncHandlers()
  console.log('Handlers IPC registrados')
  
  try {
    initDatabase()
    createWindow()
  } catch (error) {
    console.error('Error al iniciar:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
