import React, { useState } from 'react'
import DialogShell from './DialogShell'
import { useApp } from '../../context/AppContext'
import type { Note } from '../../types'
import styles from './Dialog.module.css'

/** Dialog for creating a new root-level notecard. */
const NewNotecardDialog: React.FC = () => {
  const { state, dispatch, showToast } = useApp()
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState('')

  const _close = (): void => dispatch({ type: 'CLOSE_DIALOG' })

  const _addTag = (): void => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const _removeTag = (t: string): void => setTags((prev) => prev.filter((x) => x !== t))

  const _submit = async (): Promise<void> => {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!state.activeProject) return
    try {
      const raw = await window.api.createNote(state.activeProject, { title: title.trim(), tags })
      const note = raw as Note
      dispatch({ type: 'UPSERT_NOTE', note })
      dispatch({ type: 'SET_ACTIVE_NOTE', noteId: note.id })
      showToast('Notecard created.', 'success')
      _close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create note.')
    }
  }

  return (
    <DialogShell title="New Notecard" onClose={_close}>
      <label className={styles.label}>
        Title
        <input
          className={`input ${error ? 'error' : ''}`}
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') _submit() }}
          autoFocus
          placeholder="Note title"
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </label>

      <div className={styles.label}>
        <span>Tags</span>
        <div className={styles.tagInput}>
          <input
            className="input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); _addTag() } }}
            placeholder="Add tag… (Enter or ,)"
          />
        </div>
        {tags.length > 0 && (
          <div className={styles.chips}>
            {tags.map((t) => (
              <span key={t} className="chip chip-tag">
                {t}
                <button className="chip-remove" onClick={() => _removeTag(t)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className="btn btn-secondary" onClick={_close}>Cancel</button>
        <button className="btn btn-primary" onClick={_submit}>OK</button>
      </div>
    </DialogShell>
  )
}

export default NewNotecardDialog
