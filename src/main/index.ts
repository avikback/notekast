import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { getDefaultRoot } from './store'
import { registerRootHandlers } from './ipc/root'
import { registerProjectHandlers } from './ipc/projects'
import { registerNoteHandlers } from './ipc/notes'
import { registerGitHandlers } from './ipc/git'
import { registerPopoutHandlers } from './windows/popout'

let mainWindow: BrowserWindow | null = null

function _createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0e0e1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function _registerWindowControls(): void {
  ipcMain.on('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.on('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle('window-is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })
}

app.whenReady().then(() => {
  // Ensure default root exists on first launch
  getDefaultRoot()

  _registerWindowControls()
  registerRootHandlers()
  registerProjectHandlers()
  registerNoteHandlers()
  registerGitHandlers()
  registerPopoutHandlers()

  _createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) _createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
