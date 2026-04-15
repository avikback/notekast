import { contextBridge, ipcRenderer } from 'electron'

/** Typed API exposed to the renderer via contextBridge. */
const api = {
  // ── Root ───────────────────────────────────────────────────────
  isFirstRun: (): Promise<boolean> => ipcRenderer.invoke('is-first-run'),
  getInitialDefaultPath: (): Promise<string> => ipcRenderer.invoke('get-initial-default-path'),
  setInitialRoot: (rootPath: string): Promise<void> => ipcRenderer.invoke('set-initial-root', rootPath),
  getDefaultRoot: (): Promise<string> => ipcRenderer.invoke('get-default-root'),
  copyRoot: (destination: string): Promise<string> => ipcRenderer.invoke('copy-root', destination),
  showOpenDialog: (options?: { title?: string }): Promise<string | null> =>
    ipcRenderer.invoke('show-open-dialog', options),

  // ── Projects ───────────────────────────────────────────────────
  listProjects: (): Promise<string[]> => ipcRenderer.invoke('list-projects'),
  createProject: (name: string, initGit: boolean): Promise<void> =>
    ipcRenderer.invoke('create-project', name, initGit),

  // ── Notes ──────────────────────────────────────────────────────
  listNotes: (projectPath: string): Promise<unknown[]> =>
    ipcRenderer.invoke('list-notes', projectPath),
  saveNote: (projectPath: string, noteData: unknown): Promise<void> =>
    ipcRenderer.invoke('save-note', projectPath, noteData),
  deleteNote: (projectPath: string, noteId: string): Promise<void> =>
    ipcRenderer.invoke('delete-note', projectPath, noteId),
  createNote: (projectPath: string, input: unknown): Promise<unknown> =>
    ipcRenderer.invoke('create-note', projectPath, input),
  spawnChild: (projectPath: string, input: unknown): Promise<unknown> =>
    ipcRenderer.invoke('spawn-child', projectPath, input),

  // ── Git ────────────────────────────────────────────────────────
  gitHasRepo: (projectPath: string): Promise<boolean> =>
    ipcRenderer.invoke('git-has-repo', projectPath),
  gitInit: (projectPath: string): Promise<void> => ipcRenderer.invoke('git-init', projectPath),
  gitCommit: (projectPath: string): Promise<string> =>
    ipcRenderer.invoke('git-commit', projectPath),
  gitPush: (projectPath: string): Promise<void> => ipcRenderer.invoke('git-push', projectPath),
  gitPull: (projectPath: string): Promise<void> => ipcRenderer.invoke('git-pull', projectPath),

  // ── Pop-out ────────────────────────────────────────────────────
  openPopout: (noteId: string, projectPath: string): Promise<void> =>
    ipcRenderer.invoke('open-popout', noteId, projectPath),
  openInMain: (noteId: string, projectPath: string): Promise<void> =>
    ipcRenderer.invoke('open-in-main', noteId, projectPath),

  // ── Window controls ────────────────────────────────────────────
  windowMinimize: (): void => ipcRenderer.send('window-minimize'),
  windowMaximize: (): void => ipcRenderer.send('window-maximize'),
  windowClose: (): void => ipcRenderer.send('window-close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),

  // ── Events (return unsubscribe fn) ─────────────────────────────
  onNoteChanged: (
    cb: (data: { noteId: string; projectPath: string }) => void
  ): (() => void) => {
    const handler = (_: unknown, data: { noteId: string; projectPath: string }): void => cb(data)
    ipcRenderer.on('note-changed', handler)
    return () => ipcRenderer.removeListener('note-changed', handler)
  },

  onNoteDeleted: (
    cb: (data: { noteId: string; projectPath: string }) => void
  ): (() => void) => {
    const handler = (_: unknown, data: { noteId: string; projectPath: string }): void => cb(data)
    ipcRenderer.on('note-deleted', handler)
    return () => ipcRenderer.removeListener('note-deleted', handler)
  },

  onLoadNoteInMain: (
    cb: (data: { noteId: string; projectPath: string }) => void
  ): (() => void) => {
    const handler = (_: unknown, data: { noteId: string; projectPath: string }): void => cb(data)
    ipcRenderer.on('load-note-in-main', handler)
    return () => ipcRenderer.removeListener('load-note-in-main', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
