import React from 'react'
import DialogShell from './DialogShell'
import { useApp } from '../../context/AppContext'
import type { Note } from '../../types'
import styles from './Dialog.module.css'

interface DeleteNotecardDialogProps {
  note: Note
}

/** Confirmation dialog for deleting a note. */
const DeleteNotecardDialog: React.FC<DeleteNotecardDialogProps> = ({ note }) => {
  const { dispatch, showToast } = useApp()

  const _close = (): void => dispatch({ type: 'CLOSE_DIALOG' })

  const _confirm = async (): Promise<void> => {
    try {
      await window.api.deleteNote(note.projectPath, note.id)
      dispatch({ type: 'REMOVE_NOTE', noteId: note.id })
      showToast('Note deleted.', 'success')
      _close()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed.', 'error')
      _close()
    }
  }

  return (
    <DialogShell title="Delete Notecard" onClose={_close} width={400}>
      <p className={styles.questionText}>Are you sure you want to delete this note?</p>

      <div className={styles.infoBlock}>
        <span className={styles.infoId}>{note.id}</span>
        <span className={styles.infoTitle}>{note.title || '(Untitled)'}</span>
      </div>

      <p className={styles.warningText}>This action cannot be undone.</p>

      <div className={styles.actions}>
        <button className="btn btn-secondary" onClick={_close}>Cancel</button>
        <button className="btn btn-danger" onClick={_confirm}>Delete</button>
      </div>
    </DialogShell>
  )
}

export default DeleteNotecardDialog
