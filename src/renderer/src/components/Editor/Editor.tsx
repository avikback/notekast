import React, { useState, useCallback, useEffect } from 'react'
import EditorToolbar from './EditorToolbar'
import CodeMirrorEditor from './CodeMirrorEditor'
import MarkdownPreview from './MarkdownPreview'
import type { Note, EditorMode } from '../../types'
import { useApp } from '../../context/AppContext'
import styles from './Editor.module.css'

interface EditorProps {
  note: Note
}

/**
 * Right-panel note editor. Mounts fresh (via key on noteId) whenever the
 * active note changes, resetting local draft state.
 */
const Editor: React.FC<EditorProps> = ({ note }) => {
  const { dispatch } = useApp()
  const [mode, setMode] = useState<EditorMode>('edit')
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  // Holds the current in-memory body for flush-on-Ctrl+S
  const bodyRef = React.useRef(body)

  useEffect(() => { bodyRef.current = body }, [body])

  // Flush pending edits — called by toolbar External Window and Ctrl+S
  const _flushSave = useCallback(async (): Promise<void> => {
    await window.api.saveNote(note.projectPath, {
      ...note,
      title,
      body: bodyRef.current
    })
    dispatch({ type: 'UPSERT_NOTE', note: { ...note, title, body: bodyRef.current } })
  }, [note, title, dispatch])

  const _saveBody = useCallback(async (newBody: string): Promise<void> => {
    bodyRef.current = newBody
    await window.api.saveNote(note.projectPath, { ...note, title, body: newBody })
    dispatch({ type: 'UPSERT_NOTE', note: { ...note, title, body: newBody } })
  }, [note, title, dispatch])

  const _saveTitle = useCallback(async (newTitle: string): Promise<void> => {
    await window.api.saveNote(note.projectPath, { ...note, title: newTitle, body })
    dispatch({ type: 'UPSERT_NOTE', note: { ...note, title: newTitle, body } })
  }, [note, body, dispatch])

  const _openPopout = useCallback((id: string): void => {
    window.api.openPopout(id, note.projectPath)
  }, [note.projectPath])

  return (
    <div className={styles.column}>
      <EditorToolbar
        note={{ ...note, title, body }}
        mode={mode}
        onModeChange={setMode}
        onSaveFlush={_flushSave}
      />

      {/* Luhmann ID line */}
      <p className={styles.luhmannId}>{note.id}</p>

      {/* Tag row */}
      {note.tags.length > 0 && (
        <div className={styles.tagRow}>
          {note.tags.map((t) => (
            <span key={t} className="chip chip-tag">{t}</span>
          ))}
        </div>
      )}

      {/* Relation row */}
      {(note.parent || note.links.length > 0) && (
        <div className={styles.relationRow}>
          {note.parent && (
            <button
              className="chip chip-parent"
              onClick={() => _openPopout(note.parent!)}
            >
              ↑ {note.parent}
            </button>
          )}
          {/* Child notes derived from the full note list */}
          <ChildChips noteId={note.id} projectPath={note.projectPath} onOpen={_openPopout} />
          {note.links.map((id) => (
            <button key={id} className="chip chip-link" onClick={() => _openPopout(id)}>
              {id}
            </button>
          ))}
        </div>
      )}

      {/* Title field */}
      <input
        className={styles.titleField}
        value={title}
        placeholder="Untitled"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => { if (title !== note.title) _saveTitle(title) }}
      />

      {/* Body */}
      <div className={styles.body}>
        {mode === 'edit' ? (
          <CodeMirrorEditor
            key={note.id}
            value={body}
            onChange={setBody}
            onSave={_saveBody}
          />
        ) : (
          <MarkdownPreview markdown={body} />
        )}
      </div>
    </div>
  )
}

// ── ChildChips ─────────────────────────────────────────────────────────────

interface ChildChipsProps {
  noteId: string
  projectPath: string
  onOpen: (id: string) => void
}

const ChildChips: React.FC<ChildChipsProps> = ({ noteId, onOpen }) => {
  const { state } = useApp()
  const children = state.notes.filter((n) => n.parent === noteId)
  return (
    <>
      {children.map((n) => (
        <button key={n.id} className="chip chip-child" onClick={() => onOpen(n.id)}>
          ↓ {n.id}
        </button>
      ))}
    </>
  )
}

export default Editor
