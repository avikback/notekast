import React from 'react'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './NoteActionsBar.module.css'

/** Floating bottom bar with New Notecard and Graph View buttons. */
const NoteActionsBar: React.FC = () => {
  const { state, dispatch } = useApp()

  const _newNotecard = (): void => {
    dispatch({ type: 'SHOW_DIALOG', dialog: { kind: 'new-notecard' } })
  }

  const _toggleGraph = (): void => {
    dispatch({
      type: 'SET_PANEL_VIEW',
      view: state.panelView === 'graph' ? 'list' : 'graph'
    })
  }

  return (
    <div className={styles.bar}>
      <button className={styles.btn} onClick={_newNotecard}>
        <Icon name="new-notecard" size={18} />
        New Notecard
      </button>
      <button className={styles.btn} onClick={_toggleGraph}>
        <Icon name={state.panelView === 'graph' ? 'list-view' : 'graph-view'} size={18} />
        {state.panelView === 'graph' ? 'List View' : 'Graph View'}
      </button>
    </div>
  )
}

export default NoteActionsBar
