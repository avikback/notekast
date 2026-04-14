import React, { useState, useEffect, useCallback } from 'react'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './GitStrip.module.css'

/** Collapsed capsule above the note actions bar; expands to show git actions. */
const GitStrip: React.FC = () => {
  const { state, showToast } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [hasRepo, setHasRepo] = useState(false)
  const [loading, setLoading] = useState(false)

  const projectPath = state.activeProject!

  const _checkRepo = useCallback(async () => {
    const result = await window.api.gitHasRepo(projectPath)
    setHasRepo(result)
  }, [projectPath])

  useEffect(() => {
    _checkRepo()
  }, [_checkRepo])

  const _run = async (fn: () => Promise<string | void>): Promise<void> => {
    setLoading(true)
    try {
      const msg = await fn()
      showToast(typeof msg === 'string' ? msg : 'Done.', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Git error.', 'error')
    } finally {
      setLoading(false)
      await _checkRepo()
    }
  }

  return (
    <div className={styles.capsule}>
      <button
        className={`${styles.gitIconBtn} ${hasRepo ? styles.hasRepo : ''}`}
        onClick={() => setExpanded((v) => !v)}
        data-tooltip={hasRepo ? 'Git actions' : 'No git repo'}
        disabled={loading}
      >
        <Icon name="git" size={18} />
      </button>

      {expanded && (
        <div className={styles.actions}>
          {hasRepo ? (
            <>
              <button
                className={styles.gitBtn}
                onClick={() => _run(() => window.api.gitCommit(projectPath))}
                disabled={loading}
              >
                <Icon name="commit" size={15} />
                Commit
              </button>
              <button
                className={styles.gitBtn}
                onClick={() => _run(() => window.api.gitPush(projectPath))}
                disabled={loading}
              >
                <Icon name="push" size={15} />
                Push
              </button>
              <button
                className={styles.gitBtn}
                onClick={() => _run(() => window.api.gitPull(projectPath))}
                disabled={loading}
              >
                <Icon name="pull" size={15} />
                Pull
              </button>
            </>
          ) : (
            <button
              className={styles.gitBtn}
              onClick={() => _run(() => window.api.gitInit(projectPath))}
              disabled={loading}
            >
              Init Git Repo
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default GitStrip
