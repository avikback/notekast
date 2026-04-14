import React, { useState, useCallback, useRef } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import NoteList from './components/NoteList/NoteList'
import GraphView from './components/GraphView/GraphView'
import Editor from './components/Editor/Editor'
import ToastContainer from './components/Toast/Toast'
import NewProjectDialog from './components/Dialogs/NewProjectDialog'
import NewNotecardDialog from './components/Dialogs/NewNotecardDialog'
import SpawnChildDialog from './components/Dialogs/SpawnChildDialog'
import DeleteNotecardDialog from './components/Dialogs/DeleteNotecardDialog'
import ChangeRootDialog from './components/Dialogs/ChangeRootDialog'
import ProjectPicker from './components/Popups/ProjectPicker'
import TagsEditor from './components/Popups/TagsEditor'
import LinksEditor from './components/Popups/LinksEditor'
import PopoutApp from './components/Popout/PopoutApp'
import styles from './App.module.css'

// ── Splitter ──────────────────────────────────────────────────────────────────

interface SplitterProps {
  onDrag: (delta: number) => void
}

const Splitter: React.FC<SplitterProps> = ({ onDrag }) => {
  const dragging = useRef(false)
  const lastX = useRef(0)

  const _onMouseDown = (e: React.MouseEvent): void => {
    dragging.current = true
    lastX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const _move = (ev: MouseEvent): void => {
      if (!dragging.current) return
      onDrag(ev.clientX - lastX.current)
      lastX.current = ev.clientX
    }
    const _up = (): void => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', _move)
      document.removeEventListener('mouseup', _up)
    }
    document.addEventListener('mousemove', _move)
    document.addEventListener('mouseup', _up)
  }

  return <div className={styles.splitter} onMouseDown={_onMouseDown} />
}

// ── Main layout ───────────────────────────────────────────────────────────────

const MIN_SIDEBAR = 140
const MIN_MIDDLE  = 200
const MIN_EDITOR  = 200

function _clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

const MainApp: React.FC = () => {
  const { state } = useApp()
  const activeNote = state.notes.find((n) => n.id === state.activeNoteId) ?? null

  // Column widths in px (sidebar, middle); editor takes the rest
  const containerRef = useRef<HTMLDivElement>(null)
  const [sidebarW, setSidebarW] = useState(220)
  const [middleW, setMiddleW] = useState(0) // 0 = use flex proportion

  const _dragLeft = useCallback((delta: number) => {
    setSidebarW((w) => {
      const total = containerRef.current?.clientWidth ?? 1200
      const newW = _clamp(w + delta, MIN_SIDEBAR, total - MIN_MIDDLE - MIN_EDITOR - 4)
      return newW
    })
  }, [])

  const _dragRight = useCallback((delta: number) => {
    setMiddleW((w) => {
      const total = containerRef.current?.clientWidth ?? 1200
      const effective = w || Math.floor((total - sidebarW) / 2)
      return _clamp(effective + delta, MIN_MIDDLE, total - sidebarW - MIN_EDITOR - 4)
    })
  }, [sidebarW])

  const dialog = state.dialog
  const popup = state.popup

  return (
    <div className={styles.root}>
      <TitleBar />

      <div className={styles.body} ref={containerRef}>
        {/* Sidebar */}
        <div className={styles.col} style={{ width: sidebarW, flexShrink: 0 }}>
          <Sidebar />
        </div>

        <Splitter onDrag={_dragLeft} />

        {/* Middle panel */}
        <div
          className={styles.col}
          style={middleW ? { width: middleW, flexShrink: 0 } : { flex: 1 }}
        >
          {state.activeProject ? (
            state.panelView === 'graph' ? <GraphView /> : <NoteList />
          ) : (
            <div className={styles.placeholder}>
              <p>Choose a project to see notes.</p>
            </div>
          )}
        </div>

        <Splitter onDrag={_dragRight} />

        {/* Editor panel */}
        <div className={styles.col} style={{ flex: 1 }}>
          {activeNote ? (
            <Editor key={activeNote.id} note={activeNote} />
          ) : (
            <div className={styles.placeholder}>
              <p>Open a note to edit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      <ToastContainer />

      {/* Dialogs */}
      {dialog?.kind === 'new-project' && <NewProjectDialog />}
      {dialog?.kind === 'new-notecard' && <NewNotecardDialog />}
      {dialog?.kind === 'spawn-child' && <SpawnChildDialog parentNote={dialog.parentNote} />}
      {dialog?.kind === 'delete-notecard' && <DeleteNotecardDialog note={dialog.note} />}
      {dialog?.kind === 'change-root' && <ChangeRootDialog />}

      {/* Popups */}
      {popup?.kind === 'project-picker' && <ProjectPicker anchorRect={popup.anchorRect} />}
      {popup?.kind === 'tags-editor' && <TagsEditor anchorRect={popup.anchorRect} noteId={popup.noteId} />}
      {popup?.kind === 'links-editor' && <LinksEditor anchorRect={popup.anchorRect} noteId={popup.noteId} />}
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

/** Detects pop-out mode from URL and renders the appropriate surface. */
const App: React.FC = () => {
  const isPopout = new URLSearchParams(window.location.search).get('mode') === 'popout'

  if (isPopout) return <PopoutApp />

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  )
}

export default App
