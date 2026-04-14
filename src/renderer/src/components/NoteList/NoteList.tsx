import React, { useMemo } from 'react'
import Icon from '../Icon/Icon'
import NoteCard from './NoteCard'
import GitStrip from './GitStrip'
import NoteActionsBar from './NoteActionsBar'
import { useApp } from '../../context/AppContext'
import { sortByLuhmann } from '../../utils/luhmann'
import styles from './NoteList.module.css'

/** Middle panel: project top row + scrollable note cards + bottom bars. */
const NoteList: React.FC = () => {
  const { state, dispatch } = useApp()

  const filtered = useMemo(() => {
    let result = state.notes

    // Tag filter (AND semantics)
    if (state.selectedTags.length > 0) {
      result = result.filter((n) =>
        state.selectedTags.every((t) => n.tags.includes(t))
      )
    }

    // Search filter (title or body, case-insensitive)
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      )
    }

    return sortByLuhmann(result)
  }, [state.notes, state.selectedTags, state.searchQuery])

  const _selectNote = (id: string): void => {
    dispatch({ type: 'SET_ACTIVE_NOTE', noteId: id })
  }

  return (
    <div className={styles.panel}>
      {/* Top row */}
      <div className={styles.topRow}>
        <span className={styles.projectPill}>
          {state.activeProject?.split('/').pop()}
        </span>
        <div className={styles.searchWrap}>
          <Icon name="search" size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search notes…"
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
          />
        </div>
      </div>

      {/* Note cards */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {state.notes.length === 0
              ? 'No notes in this project yet.'
              : 'No notes match the selected tags.'}
          </p>
        ) : (
          filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              active={note.id === state.activeNoteId}
              onSelect={_selectNote}
            />
          ))
        )}
      </div>

      {/* Git strip + action bar */}
      <div className={styles.footer}>
        <GitStrip />
        <NoteActionsBar />
      </div>
    </div>
  )
}

export default NoteList
