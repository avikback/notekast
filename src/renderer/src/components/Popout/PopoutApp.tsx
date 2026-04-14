import React, { useState, useEffect, useCallback } from 'react'
import Icon from '../Icon/Icon'
import CodeMirrorEditor from '../Editor/CodeMirrorEditor'
import MarkdownPreview from '../Editor/MarkdownPreview'
import type { Note, EditorMode } from '../../types'
import styles from './PopoutApp.module.css'

/** Standalone pop-out window rendered when `?mode=popout` is in the URL. */
const PopoutApp: React.FC = () => {
  const params = new URLSearchParams(window.location.search)
  const noteId = params.get('noteId') ?? ''
  const projectPath = decodeURIComponent(params.get('projectPath') ?? '')

  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mode, setMode] = useState<EditorMode>('edit')
  const [maximized, setMaximized] = useState(false)
  const bodyRef = React.useRef(body)

  useEffect(() => { bodyRef.current = body }, [body])

  // Load the note on mount
  useEffect(() => {
    if (!noteId || !projectPath) return
    window.api.listNotes(projectPath).then((rawList) => {
      const notes = rawList as Note[]
      const found = notes.find((n) => n.id === noteId) ?? null
      if (found) {
        setNote(found)
        setTitle(found.title)
        setBody(found.body)
      }
    })
  }, [noteId, projectPath])

  // Listen for note-changed broadcasts (e.g. main window saved same note)
  useEffect(() => {
    const unsub = window.api.onNoteChanged(async ({ noteId: changedId, projectPath: changedPath }) => {
      if (changedId !== noteId || changedPath !== projectPath) return
      const rawList = await window.api.listNotes(projectPath)
      const updated = (rawList as Note[]).find((n) => n.id === noteId)
      if (updated) { setNote(updated); setTitle(updated.title); setBody(updated.body) }
    })
    return unsub
  }, [noteId, projectPath])

  // Listen for note-deleted
  useEffect(() => {
    const unsub = window.api.onNoteDeleted(({ noteId: deletedId }) => {
      if (deletedId === noteId) window.api.windowClose()
    })
    return unsub
  }, [noteId])

  const _save = useCallback(async (newBody: string): Promise<void> => {
    if (!note) return
    const updated = { ...note, title, body: newBody }
    await window.api.saveNote(projectPath, updated)
    setNote(updated)
  }, [note, title, projectPath])

  const _saveTitle = useCallback(async (newTitle: string): Promise<void> => {
    if (!note) return
    const updated = { ...note, title: newTitle, body }
    await window.api.saveNote(projectPath, updated)
    setNote(updated)
  }, [note, body, projectPath])

  const _openInEditor = async (): Promise<void> => {
    if (!note) return
    // Flush any pending changes
    await window.api.saveNote(projectPath, { ...note, title, body: bodyRef.current })
    await window.api.openInMain(noteId, projectPath)
    // Window will close from main process
  }

  const _openRelated = (id: string): void => {
    window.api.openPopout(id, projectPath)
  }

  if (!note) {
    return (
      <div className={styles.loading}>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className={styles.window}>
      {/* Title bar */}
      <header className={`${styles.titleBar} drag-region`}>
        <div className={`${styles.controls} no-drag`}>
          <button className={styles.ctrlBtn} onClick={() => window.api.windowMinimize()}>
            <Icon name="minimize" size={12} />
          </button>
          <button
            className={styles.ctrlBtn}
            onClick={() => { window.api.windowMaximize(); setMaximized((v) => !v) }}
          >
            <Icon name={maximized ? 'restore' : 'maximize'} size={12} />
          </button>
          <button
            className={`${styles.ctrlBtn} ${styles.closeBtn}`}
            onClick={() => window.api.windowClose()}
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        <p className={styles.noteId}>{note.id}</p>

        {note.tags.length > 0 && (
          <div className={styles.tagRow}>
            {note.tags.map((t) => (
              <span key={t} className="chip" style={{
                background: 'var(--popout-tag-fill)',
                color: 'var(--popout-tag-text)',
                borderRadius: 'var(--radius-chip)',
                padding: '2px 10px',
                fontSize: 'var(--font-small)'
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {(note.parent || note.links.length > 0) && (
          <div className={styles.relationRow}>
            {note.parent && (
              <button className="chip chip-parent" onClick={() => _openRelated(note.parent!)}>
                ↑ {note.parent}
              </button>
            )}
            {note.links.map((id) => (
              <button key={id} className="chip chip-link" onClick={() => _openRelated(id)}>
                {id}
              </button>
            ))}
          </div>
        )}

        <input
          className={`${styles.titleField} ${mode === 'edit' ? styles.editOutline : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { if (title !== note.title) _saveTitle(title) }}
          placeholder="Untitled"
        />

        <div className={`${styles.body} ${mode === 'edit' ? styles.editOutline : ''}`}>
          {mode === 'edit' ? (
            <CodeMirrorEditor
              key={note.id}
              value={body}
              onChange={setBody}
              onSave={_save}
            />
          ) : (
            <MarkdownPreview markdown={body} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <button
          className={`${styles.footerToggle} ${mode === 'edit' ? styles.active : ''}`}
          onClick={() => setMode('edit')}
        >
          <Icon name="edit-mode" size={15} />
          Edit
        </button>
        <button
          className={`${styles.footerToggle} ${mode === 'view' ? styles.active : ''}`}
          onClick={() => setMode('view')}
        >
          <Icon name="view-mode" size={15} />
          View
        </button>
        <button className={styles.openBtn} onClick={_openInEditor}>
          <Icon name="open-in-editor" size={15} />
          Open in Editor
        </button>
      </footer>
    </div>
  )
}

export default PopoutApp
