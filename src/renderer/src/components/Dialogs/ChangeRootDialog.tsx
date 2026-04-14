import React, { useState } from 'react'
import DialogShell from './DialogShell'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './Dialog.module.css'

/** Dialog for changing the application root via a full recursive copy. */
const ChangeRootDialog: React.FC = () => {
  const { state, dispatch, reloadProjects, showToast } = useApp()
  const [destination, setDestination] = useState('')
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')

  const _close = (): void => dispatch({ type: 'CLOSE_DIALOG' })

  const _browse = async (): Promise<void> => {
    const chosen = await window.api.showOpenDialog({ title: 'Choose destination folder' })
    if (chosen) { setDestination(chosen); setError('') }
  }

  const _submit = async (): Promise<void> => {
    if (!destination.trim()) { setError('Please choose a destination.'); return }
    setCopying(true)
    try {
      const newRoot = await window.api.copyRoot(destination)
      dispatch({ type: 'SET_ROOT', root: newRoot })
      dispatch({ type: 'SET_ACTIVE_PROJECT', projectPath: null })
      await reloadProjects()
      showToast('Root changed successfully.', 'success')
      _close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Copy failed.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <DialogShell title="Change application root" onClose={_close} width={500}>
      <p className={styles.bodyText}>
        The app will copy the entire current root — all projects and files, including
        Git repositories — to the folder you choose, then switch to use that copy.
      </p>

      <div className={styles.infoBlock}>
        <span className={styles.helper}>Current root:</span>
        <span className={styles.infoTitle}>{state.defaultRoot}</span>
      </div>

      <label className={styles.label}>
        Destination
        <div className={styles.browseRow}>
          <input
            className={`input ${error ? 'error' : ''}`}
            value={destination}
            onChange={(e) => { setDestination(e.target.value); setError('') }}
            placeholder="Choose a folder…"
            readOnly
          />
          <button className="btn btn-secondary" onClick={_browse}>
            <Icon name="browse" size={16} />
            Browse
          </button>
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </label>

      <p className={styles.warningText}>Are you sure you want to change root?</p>
      <p className={styles.helper}>
        Large roots may take a moment to copy. The original folder remains on disk until
        you remove it manually.
      </p>

      <div className={styles.actions}>
        <button className="btn btn-secondary" onClick={_close} disabled={copying}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={_submit}
          disabled={!destination || copying}
        >
          {copying ? 'Copying…' : 'Copy and switch'}
        </button>
      </div>
    </DialogShell>
  )
}

export default ChangeRootDialog
