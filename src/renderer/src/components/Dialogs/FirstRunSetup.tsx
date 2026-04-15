import React, { useState, useEffect } from 'react'
import Icon from '../Icon/Icon'
import styles from './FirstRunSetup.module.css'

interface FirstRunSetupProps {
  /** Called after the user confirms their chosen save location. */
  onDone: () => void
}

/**
 * Full-screen, non-dismissable setup screen shown on first launch.
 * Lets the user confirm or change where their notes will be saved before
 * the rest of the app loads.
 */
const FirstRunSetup: React.FC<FirstRunSetupProps> = ({ onDone }) => {
  const [folder, setFolder] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.getInitialDefaultPath().then(setFolder)
  }, [])

  const _browse = async (): Promise<void> => {
    const chosen = await window.api.showOpenDialog({ title: 'Choose where to save your notes' })
    if (chosen) setFolder(chosen)
  }

  const _confirm = async (): Promise<void> => {
    if (!folder) return
    setSaving(true)
    await window.api.setInitialRoot(folder)
    onDone()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.titleBar}>
          <span className={styles.title}>Welcome to NoteKast</span>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            Your notes are saved as files on your computer — no account needed.
            Choose a folder where NoteKast will keep them. It will be created
            automatically if it does not exist yet.
          </p>

          <div>
            <p className={styles.folderLabel}>Save notes here</p>
            <div className={styles.browseRow}>
              <input
                className={`input ${styles.pathInput}`}
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="Loading…"
              />
              <button className="btn btn-secondary" onClick={_browse} disabled={saving}>
                <Icon name="browse" size={16} />
                Browse
              </button>
            </div>
          </div>

          <p className={styles.hint}>
            You can change this at any time from the app's settings.
          </p>

          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              onClick={_confirm}
              disabled={!folder || saving}
            >
              {saving ? 'Setting up…' : 'Get started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirstRunSetup
