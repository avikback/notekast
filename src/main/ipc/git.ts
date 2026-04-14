import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { execSync, spawnSync } from 'child_process'

/** Returns true if the directory contains a .git folder. */
function _hasRepo(projectPath: string): boolean {
  return fs.existsSync(path.join(projectPath, '.git'))
}

/** Runs a git command; returns stdout string or throws with stderr as message. */
function _git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' })
  if (result.error) throw new Error(`git not found: ${result.error.message}`)
  if (result.status !== 0) throw new Error(result.stderr?.trim() || `git ${args[0]} failed`)
  return result.stdout?.trim() ?? ''
}

/** Builds a commit message summarising changes to .md files in the working tree. */
function _buildCommitMessage(projectPath: string): string {
  const status = _git(['status', '--porcelain'], projectPath)
  if (!status) return ''

  const added: string[] = []
  const modified: string[] = []
  const deleted: string[] = []

  for (const line of status.split('\n')) {
    if (!line.trim()) continue
    const code = line.slice(0, 2).trim()
    const file = line.slice(3).trim()
    if (!file.endsWith('.md')) continue
    const name = path.basename(file, '.md')
    if (code === 'A' || code === '??') added.push(name)
    else if (code === 'D') deleted.push(name)
    else modified.push(name)
  }

  const parts: string[] = []
  if (added.length) parts.push(`add: ${added.join(', ')}`)
  if (modified.length) parts.push(`update: ${modified.join(', ')}`)
  if (deleted.length) parts.push(`delete: ${deleted.join(', ')}`)
  return parts.length ? parts.join('; ') : 'update notes'
}

export function registerGitHandlers(): void {
  ipcMain.handle('git-has-repo', (_event, projectPath: string) => _hasRepo(projectPath))

  ipcMain.handle('git-init', (_event, projectPath: string) => {
    _git(['init'], projectPath)
    _git(['add', '.'], projectPath)
    try {
      execSync('git commit --allow-empty -m "initial commit"', {
        cwd: projectPath,
        env: { ...process.env, GIT_AUTHOR_NAME: 'NoteKast', GIT_AUTHOR_EMAIL: 'notekast@local',
               GIT_COMMITTER_NAME: 'NoteKast', GIT_COMMITTER_EMAIL: 'notekast@local' }
      })
    } catch {
      // Tolerate: may fail if git identity not configured globally
    }
  })

  ipcMain.handle('git-commit', (_event, projectPath: string): string => {
    if (!_hasRepo(projectPath)) throw new Error('No git repository in this project.')
    _git(['add', '.'], projectPath)
    const status = _git(['status', '--porcelain'], projectPath)
    if (!status) return 'Nothing to commit.'
    const message = _buildCommitMessage(projectPath)
    _git(['commit', '-m', message], projectPath)
    return `Commit successful: "${message}"`
  })

  ipcMain.handle('git-push', (_event, projectPath: string) => {
    if (!_hasRepo(projectPath)) throw new Error('No git repository in this project.')
    _git(['push'], projectPath)
  })

  ipcMain.handle('git-pull', (_event, projectPath: string) => {
    if (!_hasRepo(projectPath)) throw new Error('No git repository in this project.')
    _git(['pull'], projectPath)
  })
}
