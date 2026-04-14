import React, { useRef } from 'react'
import Icon from '../Icon/Icon'
import type { Note, EditorMode } from '../../types'
import { useApp } from '../../context/AppContext'
import styles from './EditorToolbar.module.css'

interface EditorToolbarProps {
  note: Note
  mode: EditorMode
  onModeChange: (m: EditorMode) => void
  onSaveFlush: () => void
}

/** Toolbar strip at the top of the right editor panel. */
const EditorToolbar: React.FC<EditorToolbarProps> = ({ note, mode, onModeChange, onSaveFlush }) => {
  const { dispatch } = useApp()
  const tagsRef = useRef<HTMLButtonElement>(null)
  const linksRef = useRef<HTMLButtonElement>(null)

  const _openPopout = async (): Promise<void> => {
    onSaveFlush()
    await window.api.openPopout(note.id, note.projectPath)
    dispatch({ type: 'SET_ACTIVE_NOTE', noteId: null })
  }

  const _spawnChild = (): void => {
    dispatch({ type: 'SHOW_DIALOG', dialog: { kind: 'spawn-child', parentNote: note } })
  }

  const _openTagsEditor = (): void => {
    if (!tagsRef.current) return
    dispatch({
      type: 'SHOW_POPUP',
      popup: { kind: 'tags-editor', anchorRect: tagsRef.current.getBoundingClientRect(), noteId: note.id }
    })
  }

  const _openLinksEditor = (): void => {
    if (!linksRef.current) return
    dispatch({
      type: 'SHOW_POPUP',
      popup: { kind: 'links-editor', anchorRect: linksRef.current.getBoundingClientRect(), noteId: note.id }
    })
  }

  const _confirmDelete = (): void => {
    dispatch({ type: 'SHOW_DIALOG', dialog: { kind: 'delete-notecard', note } })
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button className="icon-btn" onClick={_openPopout} data-tooltip="External Window">
          <Icon name="external-window" size={18} />
        </button>
        <button className="icon-btn" onClick={_spawnChild} data-tooltip="Spawn Child">
          <Icon name="spawn-child" size={18} />
        </button>
        <button ref={linksRef} className="icon-btn" onClick={_openLinksEditor} data-tooltip="Add Link">
          <Icon name="add-link" size={18} />
        </button>
        <button
          className="icon-btn"
          disabled
          data-tooltip="Add Reference (coming soon)"
        >
          <Icon name="add-reference" size={18} />
        </button>
        <button ref={tagsRef} className="icon-btn" onClick={_openTagsEditor} data-tooltip="Tags">
          <Icon name="tags" size={18} />
        </button>
        <button
          className="icon-btn"
          onClick={_confirmDelete}
          data-tooltip="Delete"
          style={{ color: 'var(--danger)' }}
        >
          <Icon name="delete" size={18} />
        </button>
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.toggleBtn} ${mode === 'edit' ? styles.active : ''}`}
          onClick={() => onModeChange('edit')}
        >
          <Icon name="edit-mode" size={16} />
          Edit
        </button>
        <button
          className={`${styles.toggleBtn} ${mode === 'view' ? styles.active : ''}`}
          onClick={() => onModeChange('view')}
        >
          <Icon name="view-mode" size={16} />
          View
        </button>
      </div>
    </div>
  )
}

export default EditorToolbar
