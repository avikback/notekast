import React, { useState } from 'react'
import DialogShell from './DialogShell'
import { useApp } from '../../context/AppContext'
import styles from './Dialog.module.css'

/** Dialog for creating a new project under the current default root. */
const NewProjectDialog: React.FC = () => {
  const { dispatch, reloadProjects, showToast } = useApp()
  const [name, setName] = useState('')
  const [initGit, setInitGit] = useState(false)
  const [error, setError] = useState('')

  const _close = (): void => dispatch({ type: 'CLOSE_DIALOG' })

  const _validate = (v: string): string => {
    if (!v.trim()) return 'Project name is required.'
    if (v.includes('/')) return 'Project name must not contain "/".'
    return ''
  }

  const _submit = async (): Promise<void> => {
    const err = _validate(name)
    if (err) { setError(err); return }
    try {
      await window.api.createProject(name.trim(), initGit)
      await reloadProjects()
      showToast(`Project "${name.trim()}" created.`, 'success')
      _close()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create project.')
    }
  }

  return (
    <DialogShell title="New Project" onClose={_close}>
      <label className={styles.label}>
        Project name
        <input
          className={`input ${error ? 'error' : ''}`}
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') _submit() }}
          autoFocus
          placeholder="my-project"
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </label>
      <p className={styles.helper}>
        The project folder will be created under your current application root.
      </p>
      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          className={styles.check}
          checked={initGit}
          onChange={(e) => setInitGit(e.target.checked)}
        />
        Init as git repo?
      </label>
      <div className={styles.actions}>
        <button className="btn btn-secondary" onClick={_close}>Cancel</button>
        <button className="btn btn-primary" onClick={_submit}>OK</button>
      </div>
    </DialogShell>
  )
}

export default NewProjectDialog
