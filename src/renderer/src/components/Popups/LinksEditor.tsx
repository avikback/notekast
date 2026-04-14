import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import styles from './Popup.module.css'

interface LinksEditorProps {
  anchorRect: DOMRect
  noteId: string
}

/** Anchored popup for editing general / peer links on a note. */
const LinksEditor: React.FC<LinksEditorProps> = ({ anchorRect, noteId }) => {
  const { state, dispatch } = useApp()
  const [input, setInput] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const note = state.notes.find((n) => n.id === noteId)

  // All note IDs for autocomplete (except self and already linked)
  const suggestions = useMemo(() => {
    const q = input.toLowerCase()
    if (!q) return []
    return state.notes
      .filter(
        (n) =>
          n.id !== noteId &&
          !note?.links.includes(n.id) &&
          (n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [input, state.notes, noteId, note])

  const _save = async (newLinks: string[]): Promise<void> => {
    if (!note) return
    const updated = { ...note, links: newLinks }
    await window.api.saveNote(note.projectPath, updated)
    dispatch({ type: 'UPSERT_NOTE', note: updated })
  }

  const _addLink = async (id: string): Promise<void> => {
    const t = id.trim()
    if (!t || note?.links.includes(t)) return
    await _save([...(note?.links ?? []), t])
    setInput('')
  }

  const _removeLink = async (id: string): Promise<void> => {
    await _save((note?.links ?? []).filter((l) => l !== id))
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
    <div ref={ref} className={styles.popup} style={{ top, left, width: 280 }}>
      <p className={styles.popupTitle}>General Links</p>
      <div className={styles.chipWrap}>
        {note?.links.map((id) => (
          <span key={id} className="chip chip-link">
            {id}
            <button className="chip-remove" onClick={() => _removeLink(id)}>×</button>
          </span>
        ))}
      </div>
      <div className={styles.inputWrap}>
        <input
          className={styles.searchInput}
          placeholder="Add link (note ID or title)…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); _addLink(input) }
          }}
          autoFocus
        />
      </div>
      {suggestions.length > 0 && (
        <ul className={`${styles.list} ${styles.completerLinks}`}>
          {suggestions.map((n) => (
            <li key={n.id}>
              <button className={styles.completerItem} onClick={() => _addLink(n.id)}>
                <span className={styles.suggId}>{n.id}</span> {n.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LinksEditor
