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
      const { execSync } = await import('child_process')
      execSync('git init', { cwd: projectPath })
      execSync('git commit --allow-empty -m "initial commit"', {
        cwd: projectPath,
        env: { ...process.env, GIT_AUTHOR_NAME: 'NoteKast', GIT_AUTHOR_EMAIL: 'notekast@local',
               GIT_COMMITTER_NAME: 'NoteKast', GIT_COMMITTER_EMAIL: 'notekast@local' }
      })
    }
  })
}
