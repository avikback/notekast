import { BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

/** Map from noteId → its BrowserWindow (if still open). */
const _openPopouts = new Map<string, BrowserWindow>()

/** Creates or focuses a pop-out window for the given note. */
export function openPopout(noteId: string, projectPath: string): void {
  const existing = _openPopouts.get(noteId)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return
  }

  const win = new BrowserWindow({
    width: 420,
    height: 480,
    minWidth: 380,
    minHeight: 320,
    frame: false,
    transparent: false,
    backgroundColor: '#0e0e1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const encodedProject = encodeURIComponent(projectPath)
  const query = `?mode=popout&noteId=${noteId}&projectPath=${encodedProject}`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + query)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'), { search: query })
  }

  _openPopouts.set(noteId, win)
  win.on('closed', () => _openPopouts.delete(noteId))
}

/** Sends a "load note in main window" event to the main BrowserWindow. */
function _notifyMainWindow(noteId: string, projectPath: string): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    // The main window has no `mode` in its URL — simplest heuristic is window ID ordering;
    // more robust: we tag the main window at creation.
    if (!win.webContents.getURL().includes('mode=popout')) {
      win.webContents.send('load-note-in-main', { noteId, projectPath })
    }
  })
}

export function registerPopoutHandlers(): void {
  ipcMain.handle('open-popout', (_event, noteId: string, projectPath: string) => {
    openPopout(noteId, projectPath)
  })

  ipcMain.handle('open-in-main', (_event, noteId: string, projectPath: string) => {
    _notifyMainWindow(noteId, projectPath)
    // Close the pop-out that requested this
    const win = _openPopouts.get(noteId)
    if (win && !win.isDestroyed()) {
      win.close()
    }
  })

  ipcMain.handle('close-popout', (_event, noteId: string) => {
    const win = _openPopouts.get(noteId)
    if (win && !win.isDestroyed()) win.close()
  })
}
