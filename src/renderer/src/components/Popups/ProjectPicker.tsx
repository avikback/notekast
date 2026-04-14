import React, { useState, useEffect, useRef, useCallback } from 'react'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './Popup.module.css'

interface ProjectPickerProps {
  anchorRect: DOMRect
}

/** Floating popup listing projects under the current root. */
const ProjectPicker: React.FC<ProjectPickerProps> = ({ anchorRect }) => {
  const { state, dispatch } = useApp()
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = state.projects.filter((p) =>
    p.toLowerCase().includes(query.toLowerCase())
  )

  const _select = useCallback(
    (name: string): void => {
      const projectPath = `${state.defaultRoot}/${name}`
      dispatch({ type: 'SET_ACTIVE_PROJECT', projectPath })
      dispatch({ type: 'CLOSE_POPUP' })
    },
    [state.defaultRoot, dispatch]
  )

  // Close on outside click
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
    <div
      ref={ref}
      className={styles.popup}
      style={{ top, left, minWidth: Math.max(anchorRect.width, 220) }}
    >
      <div className={styles.searchWrap}>
        <Icon name="search" size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <ul className={styles.list}>
        {filtered.map((name) => (
          <li key={name}>
            <button className={styles.row} onClick={() => _select(name)}>
              {name}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className={styles.empty}>No projects found.</li>
        )}
      </ul>
    </div>
  )
}

export default ProjectPicker
