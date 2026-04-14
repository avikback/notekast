import React, { useState } from 'react'
import DialogShell from './DialogShell'
import { useApp } from '../../context/AppContext'
import type { Note } from '../../types'
import styles from './Dialog.module.css'

interface SpawnChildDialogProps {
  parentNote: Note
}

/** Dialog for spawning a child note under the active note. */
const SpawnChildDialog: React.FC<SpawnChildDialogProps> = ({ parentNote }) => {
  const { state, dispatch, showToast } = useApp()
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [extraTags, setExtraTags] = useState<string[]>([])
  const [error, setError] = useState('')

  const _close = (): void => dispatch({ type: 'CLOSE_DIALOG' })

  const _addTag = (): void => {
    const t = tagInput.trim().toLowerCase()
    if (t && !parentNote.tags.includes(t) && !extraTags.includes(t)) {
      setExtraTags((prev) => [...prev, t])
    }
    setTagInput('')
  }

  const _removeExtra = (t: string): void => setExtraTags((prev) => prev.filter((x) => x !== t))

  const _submit = async (): Promise<void> => {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!state.activeProject) return
    try {
      const raw = await window.api.spawnChild(state.activeProject, {
        title: title.trim(),
        additionalTags: extraTags,
        parentId: parentNote.id
      })
      const note = raw as Note
      dispatch({ type: 'UPSERT_NOTE', note })
      dispatch({ type: 'SET_ACTIVE_NOTE', noteId: note.id })
      showToast('Child note created.', 'success')
      _close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to spawn child.')
    }
  }

  return (
    <DialogShell title="Spawn Child Note" onClose={_close}>
      <p className={styles.helper}>
        Creating a child of <strong style={{ color: 'var(--accent)' }}>{parentNote.id}</strong>:{' '}
        {parentNote.title}
      </p>

      <label className={styles.label}>
        Title
        <input
          className={`input ${error ? 'error' : ''}`}
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') _submit() }}
          autoFocus
          placeholder="Child note title"
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </label>

      {/* Inherited tags (locked) */}
      {parentNote.tags.length > 0 && (
        <div className={styles.label}>
          <span>Inherited tags</span>
          <div className={styles.chips}>
            {parentNote.tags.map((t) => (
              <span key={t} className="chip chip-tag" style={{ opacity: 0.7 }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Additional tags */}
      <div className={styles.label}>
        <span>Additional tags</span>
        <input
          className="input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); _addTag() } }}
          placeholder="Add tag… (Enter or ,)"
        />
        {extraTags.length > 0 && (
          <div className={styles.chips}>
            {extraTags.map((t) => (
              <span key={t} className="chip chip-tag">
                {t}
                <button className="chip-remove" onClick={() => _removeExtra(t)}>×</button>
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

export default SpawnChildDialog
