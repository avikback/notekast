import React, { useRef } from 'react'
import Icon from '../Icon/Icon'
import TagFilter from './TagFilter'
import { useApp } from '../../context/AppContext'
import styles from './Sidebar.module.css'

/**
 * Left sidebar: app title, New Project + Choose Project buttons, and tag filter
 * (visible only when a project is active).
 */
const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp()
  const chooseBtnRef = useRef<HTMLButtonElement>(null)

  const _openNewProject = (): void => {
    dispatch({ type: 'SHOW_DIALOG', dialog: { kind: 'new-project' } })
  }

  const _openProjectPicker = (): void => {
    if (!chooseBtnRef.current) return
    const rect = chooseBtnRef.current.getBoundingClientRect()
    dispatch({ type: 'SHOW_POPUP', popup: { kind: 'project-picker', anchorRect: rect } })
  }

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.title}>NoteKast</h1>

      <button className={styles.actionBtn} onClick={_openNewProject}>
        <Icon name="new-project" size={18} />
        New Project
      </button>

      <button
        ref={chooseBtnRef}
        className={styles.actionBtn}
        onClick={_openProjectPicker}
      >
        <Icon name="choose-project" size={18} />
        Choose Project
      </button>

      {state.activeProject && <TagFilter />}
    </aside>
  )
}

export default Sidebar
