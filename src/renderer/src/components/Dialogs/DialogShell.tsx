import React, { useEffect } from 'react'
import styles from './DialogShell.module.css'

interface DialogShellProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}

/**
 * Frameless modal shell shared by all dialogs.
 * 12 px radius, #2a2a4a border, #16213e body, #0e0e1a title bar.
 */
const DialogShell: React.FC<DialogShellProps> = ({ title, onClose, children, width = 460 }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.titleBar}>
          <span className={styles.titleText}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

export default DialogShell
