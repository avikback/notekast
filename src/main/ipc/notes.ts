import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { nextRootId, nextChildId } from '../../shared/luhmann'

// Re-export types inline to avoid renderer imports in main
interface NoteFrontmatter {
  id: string
  title: string
  parent: string | null
  tags: string[]
  links: string[]
  references: string[]
}

interface Note extends NoteFrontmatter {
  body: string
  filePath: string
  projectPath: string
}

interface CreateNoteInput {
  title: string
  tags: string[]
}

interface SpawnChildInput {
  title: string
  additionalTags: string[]
  parentId: string
}

/** Parses a .md file into a Note object. Returns null if frontmatter is missing `id`. */
function _parseNote(filePath: string, projectPath: string): Note | null {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  if (!data.id) return null
  return {
    id: String(data.id),
    title: String(data.title ?? ''),
    parent: data.parent ? String(data.parent) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    links: Array.isArray(data.links) ? data.links.map(String) : [],
    references: Array.isArray(data.references) ? data.references.map(String) : [],
    body: content.trimStart(),
    filePath,
    projectPath
  }
}

/** Serialises a Note back to disk as YAML frontmatter + body. */
function _writeNote(note: Omit<Note, 'filePath' | 'projectPath'>, filePath: string): void {
  const fm: NoteFrontmatter = {
    id: note.id,
    title: note.title,
    parent: note.parent,
    tags: note.tags,
    links: note.links,
    references: note.references
  }
  const content = matter.stringify('\n' + note.body, fm)
  fs.writeFileSync(filePath, content, 'utf-8')
}

/** Broadcasts a note-changed event to every renderer window except the sender. */
function _broadcastNoteChanged(
  senderWebContentsId: number,
  noteId: string,
  projectPath: string
): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.webContents.id !== senderWebContentsId) {
      win.webContents.send('note-changed', { noteId, projectPath })
    }
  })
}

export function registerNoteHandlers(): void {
  ipcMain.handle('list-notes', (_event, projectPath: string): Note[] => {
    if (!fs.existsSync(projectPath)) return []
    return fs
      .readdirSync(projectPath)
      .filter((f) => f.endsWith('.md'))
      .map((f) => _parseNote(path.join(projectPath, f), projectPath))
      .filter((n): n is Note => n !== null)
  })

  ipcMain.handle('save-note', (event, projectPath: string, noteData: Omit<Note, 'filePath' | 'projectPath'>) => {
    const filePath = path.join(projectPath, `${noteData.id}.md`)
    _writeNote(noteData, filePath)
    _broadcastNoteChanged(event.sender.id, noteData.id, projectPath)
  })

  ipcMain.handle('delete-note', (_ev, projectPath: string, noteId: string) => {
    const filePath = path.join(projectPath, `${noteId}.md`)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('note-deleted', { noteId, projectPath })
    })
  })

  ipcMain.handle('create-note', (_ev, projectPath: string, input: CreateNoteInput): Note => {
    const existing = fs
      .readdirSync(projectPath)
      .filter((f) => f.endsWith('.md'))
      .map((f) => _parseNote(path.join(projectPath, f), projectPath))
      .filter((n): n is Note => n !== null)
      .map((n) => n.id)

    const id = nextRootId(existing)
    const normalised = input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
    const filePath = path.join(projectPath, `${id}.md`)
    const note = { id, title: input.title, parent: null, tags: normalised, links: [], references: [], body: '' }
    _writeNote(note, filePath)
    return { ...note, filePath, projectPath }
  })

  ipcMain.handle('spawn-child', (_ev, projectPath: string, input: SpawnChildInput): Note => {
    const existing = fs
      .readdirSync(projectPath)
      .filter((f) => f.endsWith('.md'))
      .map((f) => _parseNote(path.join(projectPath, f), projectPath))
      .filter((n): n is Note => n !== null)

    const parentNote = existing.find((n) => n.id === input.parentId)
    if (!parentNote) throw new Error(`Parent note "${input.parentId}" not found.`)

    const existingIds = existing.map((n) => n.id)
    const id = nextChildId(existingIds, input.parentId)

    // Merge: parent tags first, then additional (deduplicated, normalised)
    const extra = input.additionalTags.map((t) => t.trim().toLowerCase()).filter(Boolean)
    const merged = [...parentNote.tags]
    for (const t of extra) {
      if (!merged.includes(t)) merged.push(t)
    }

    const filePath = path.join(projectPath, `${id}.md`)
    const note = { id, title: input.title, parent: input.parentId, tags: merged, links: [], references: [], body: '' }
    _writeNote(note, filePath)
    return { ...note, filePath, projectPath }
  })
}
