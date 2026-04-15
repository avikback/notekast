import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { isFirstRun, getDefaultRoot, setDefaultRoot } from '../store'

/** Recursively copies src into dest, preserving all files including .git. */
async function _copyRecursive(src: string, dest: string): Promise<void> {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await _copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/** Validates that dest is a writable location that is not source or a child of source. */
function _validateCopyDestination(src: string, dest: string): string | null {
  const resolvedSrc = path.resolve(src)
  const resolvedDest = path.resolve(dest)
  if (resolvedDest === resolvedSrc) return 'Destination is the same as the current root.'
  if (resolvedDest.startsWith(resolvedSrc + path.sep))
    return 'Destination is inside the current root — this would cause infinite recursion.'
  try {
    fs.mkdirSync(resolvedDest, { recursive: true })
    fs.accessSync(resolvedDest, fs.constants.W_OK)
  } catch {
    return 'Destination is not writable.'
  }
  return null
}

export function registerRootHandlers(): void {
  ipcMain.handle('is-first-run', () => isFirstRun())

  ipcMain.handle('get-initial-default-path', () =>
    path.join(app.getPath('documents'), 'NoteKast')
  )

  ipcMain.handle('set-initial-root', (_event, rootPath: string) => {
    fs.mkdirSync(rootPath, { recursive: true })
    setDefaultRoot(rootPath)
  })

  ipcMain.handle('get-default-root', () => getDefaultRoot())

  ipcMain.handle('copy-root', async (_event, destination: string) => {
    const src = getDefaultRoot()
    const err = _validateCopyDestination(src, destination)
    if (err) throw new Error(err)
    const destWithSubdir = path.join(destination, path.basename(src))
    await _copyRecursive(src, destWithSubdir)
    setDefaultRoot(destWithSubdir)
    return destWithSubdir
  })

  ipcMain.handle('show-open-dialog', async (_event, options: { title?: string } = {}) => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win ?? new BrowserWindow(), {
      title: options.title ?? 'Choose folder',
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
