import React, { useState, useMemo } from 'react'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './TagFilter.module.css'

/** Tag filter panel shown in the sidebar when a project is active. */
const TagFilter: React.FC = () => {
  const { state, dispatch } = useApp()
  const [query, setQuery] = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    state.notes.forEach((n) => n.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [state.notes])

  const filtered = query
    ? allTags.filter((t) => t.includes(query.toLowerCase()))
    : allTags

  return (
    <div className={styles.container}>
      <p className={styles.heading}>Tags</p>
      <div className={styles.searchWrap}>
        <Icon name="search" size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className={styles.list}>
        {filtered.map((tag) => {
          const checked = state.selectedTags.includes(tag)
          return (
            <li key={tag} className={styles.row}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checked}
                  onChange={() => dispatch({ type: 'TOGGLE_TAG', tag })}
                />
                {tag}
              </label>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className={styles.empty}>No tags yet.</li>
        )}
      </ul>
      {state.selectedTags.length > 0 && (
        <button
          className={styles.clearBtn}
          onClick={() => dispatch({ type: 'CLEAR_TAGS' })}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default TagFilter
