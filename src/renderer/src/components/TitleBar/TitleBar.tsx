import React, { useState, useEffect } from 'react'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './TitleBar.module.css'

/**
 * Custom frameless title bar: 44 px tall, #0e0e1a background.
 * Contains the File menu (Change application root…) and window controls.
 */
const TitleBar: React.FC = () => {
  const { dispatch } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.api.windowIsMaximized().then(setMaximized)
  }, [])

  const _openChangeRoot = (): void => {
    setMenuOpen(false)
    dispatch({ type: 'SHOW_DIALOG', dialog: { kind: 'change-root' } })
  }

  const _toggleMenu = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setMenuOpen((v) => !v)
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const close = (): void => setMenuOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  return (
    <header className={`${styles.bar} drag-region`}>
      {/* File menu */}
      <div className={`${styles.fileMenu} no-drag`}>
        <button className={styles.fileBtn} onClick={_toggleMenu}>
          File
        </button>
        {menuOpen && (
          <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
            <button className={styles.menuItem} onClick={_openChangeRoot}>
              Change application root…
            </button>
          </div>
        )}
      </div>

      {/* Window controls */}
      <div className={`${styles.controls} no-drag`}>
        <button
          className={styles.ctrlBtn}
          onClick={() => window.api.windowMinimize()}
          aria-label="Minimize"
        >
          <Icon name="minimize" size={14} />
        </button>
        <button
          className={styles.ctrlBtn}
          onClick={() => {
            window.api.windowMaximize()
            setMaximized((v) => !v)
          }}
          aria-label={maximized ? 'Restore' : 'Maximize'}
        >
          <Icon name={maximized ? 'restore' : 'maximize'} size={14} />
        </button>
        <button
          className={`${styles.ctrlBtn} ${styles.closeBtn}`}
          onClick={() => window.api.windowClose()}
          aria-label="Close"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </header>
  )
}

export default TitleBar
