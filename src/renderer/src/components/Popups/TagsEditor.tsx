import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import styles from './Popup.module.css'

interface TagsEditorProps {
  anchorRect: DOMRect
  noteId: string
}

/** Anchored popup for editing tags on a note. */
const TagsEditor: React.FC<TagsEditorProps> = ({ anchorRect, noteId }) => {
  const { state, dispatch } = useApp()
  const [input, setInput] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const note = state.notes.find((n) => n.id === noteId)

  // All unique tags across project for autocomplete
  const allTags = useMemo(() => {
    const s = new Set<string>()
    state.notes.forEach((n) => n.tags.forEach((t) => s.add(t)))
    return [...s].sort()
  }, [state.notes])

  const suggestions = input
    ? allTags.filter(
        (t) => t.includes(input.toLowerCase()) && !note?.tags.includes(t)
      )
    : []

  const _save = async (newTags: string[]): Promise<void> => {
    if (!note) return
    const updated = { ...note, tags: newTags }
    await window.api.saveNote(note.projectPath, updated)
    dispatch({ type: 'UPSERT_NOTE', note: updated })
  }

  const _addTag = async (tag: string): Promise<void> => {
    const t = tag.trim().toLowerCase()
    if (!t || note?.tags.includes(t)) return
    await _save([...(note?.tags ?? []), t])
    setInput('')
  }

  const _removeTag = async (tag: string): Promise<void> => {
    await _save((note?.tags ?? []).filter((t) => t !== tag))
  }

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        dispatch({ type: 'CLOSE_POPUP' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dispatch])

  const top = anchorRect.bottom + 6
  const left = anchorRect.left

  return (
    <div ref={ref} className={styles.popup} style={{ top, left, width: 260 }}>
      <p className={styles.popupTitle}>Tags</p>
      <div className={styles.chipWrap}>
        {note?.tags.map((t) => (
          <span key={t} className="chip chip-tag">
            {t}
            <button className="chip-remove" onClick={() => _removeTag(t)}>×</button>
          </span>
        ))}
      </div>
      <div className={styles.inputWrap}>
        <input
          className={styles.searchInput}
          placeholder="Add tag…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); _addTag(input) }
          }}
          autoFocus
        />
      </div>
      {suggestions.length > 0 && (
        <ul className={`${styles.list} ${styles.completer}`}>
          {suggestions.slice(0, 8).map((t) => (
            <li key={t}>
              <button className={styles.completerItem} onClick={() => _addTag(t)}>{t}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TagsEditor
