import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { getDefaultRoot } from '../store'

/**
 * Returns the names (not full paths) of immediate subdirectories of the
 * default root that qualify as NoteKast projects. Only directories are
 * returned; plain files are ignored.
 */
function _listProjectNames(): string[] {
  const root = getDefaultRoot()
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

export function registerProjectHandlers(): void {
  ipcMain.handle('list-projects', () => _listProjectNames())

  ipcMain.handle('create-project', async (_event, name: string, initGit: boolean) => {
    const root = getDefaultRoot()
    const projectPath = path.join(root, name)

    if (fs.existsSync(projectPath)) throw new Error(`A project named "${name}" already exists.`)
    fs.mkdirSync(projectPath, { recursive: true })

    if (initGit) {
      const { spawnSync } = await import('child_process')
      spawnSync('git', ['init', '-b', 'main'], { cwd: projectPath })
      spawnSync('git', [
        '-c', 'user.name=NoteKast', '-c', 'user.email=notekast@local',
        'commit', '--allow-empty', '-m', 'initial commit'
      ], { cwd: projectPath })
    }
  })
}
