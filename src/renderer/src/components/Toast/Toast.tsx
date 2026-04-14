import React from 'react'
import { useApp } from '../../context/AppContext'
import styles from './Toast.module.css'

/** Fixed overlay that renders all active toasts. */
const ToastContainer: React.FC = () => {
  const { state } = useApp()
  if (state.toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${t.variant === 'success' ? styles.success : styles.error}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
