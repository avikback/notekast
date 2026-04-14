import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { AppState, AppAction, Note, Toast } from '../types'

// ── Reducer ──────────────────────────────────────────────────────────────────

function _reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROOT':
      return { ...state, defaultRoot: action.root }
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects }
    case 'SET_ACTIVE_PROJECT':
      return {
        ...state,
        activeProject: action.projectPath,
        notes: [],
        activeNoteId: null,
        selectedTags: [],
        searchQuery: '',
        panelView: 'list'
      }
    case 'SET_NOTES':
      return { ...state, notes: action.notes }
    case 'UPSERT_NOTE': {
      const idx = state.notes.findIndex((n) => n.id === action.note.id)
      const notes =
        idx >= 0
          ? state.notes.map((n) => (n.id === action.note.id ? action.note : n))
          : [...state.notes, action.note]
      return { ...state, notes }
    }
    case 'REMOVE_NOTE': {
      const notes = state.notes.filter((n) => n.id !== action.noteId)
      const activeNoteId = state.activeNoteId === action.noteId ? null : state.activeNoteId
      return { ...state, notes, activeNoteId }
    }
    case 'SET_ACTIVE_NOTE':
      return { ...state, activeNoteId: action.noteId }
    case 'TOGGLE_TAG': {
      const selected = state.selectedTags.includes(action.tag)
        ? state.selectedTags.filter((t) => t !== action.tag)
        : [...state.selectedTags, action.tag]
      return { ...state, selectedTags: selected }
    }
    case 'CLEAR_TAGS':
      return { ...state, selectedTags: [] }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query }
    case 'SET_PANEL_VIEW':
      return { ...state, panelView: action.view }
    case 'SHOW_DIALOG':
      return { ...state, dialog: action.dialog, popup: null }
    case 'CLOSE_DIALOG':
      return { ...state, dialog: null }
    case 'SHOW_POPUP':
      return { ...state, popup: action.popup }
    case 'CLOSE_POPUP':
      return { ...state, popup: null }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

const _initialState: AppState = {
  defaultRoot: '',
  projects: [],
  activeProject: null,
  notes: [],
  activeNoteId: null,
  selectedTags: [],
  searchQuery: '',
  panelView: 'list',
  dialog: null,
  popup: null,
  toasts: []
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  /** Reloads the note list for the active project from disk. */
  reloadNotes: () => Promise<void>
  /** Reloads the project list from disk. */
  reloadProjects: () => Promise<void>
  /** Adds a toast that auto-dismisses after ~1 s. */
  showToast: (message: string, variant: 'success' | 'error') => void
  /** Returns the Note for the given ID if it exists in the loaded list. */
  noteById: (id: string) => Note | undefined
}

const AppContext = createContext<AppContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(_reducer, _initialState)

  const reloadProjects = useCallback(async () => {
    const projects = await window.api.listProjects()
    dispatch({ type: 'SET_PROJECTS', projects })
  }, [])

  const reloadNotes = useCallback(async () => {
    if (!state.activeProject) return
    const raw = await window.api.listNotes(state.activeProject)
    dispatch({ type: 'SET_NOTES', notes: raw as Note[] })
  }, [state.activeProject])

  const showToast = useCallback((message: string, variant: 'success' | 'error') => {
    const id = String(Date.now())
    const toast: Toast = { id, message, variant }
    dispatch({ type: 'ADD_TOAST', toast })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 1100)
  }, [])

  const noteById = useCallback(
    (id: string) => state.notes.find((n) => n.id === id),
    [state.notes]
  )

  // Bootstrap: load root and projects on mount
  useEffect(() => {
    window.api.getDefaultRoot().then((root) => {
      dispatch({ type: 'SET_ROOT', root })
    })
    reloadProjects()
  }, [reloadProjects])

  // Reload notes whenever the active project changes
  useEffect(() => {
    reloadNotes()
  }, [reloadNotes])

  // Listen for note-changed events from main process (saves by other windows)
  useEffect(() => {
    const unsub = window.api.onNoteChanged(async ({ projectPath }) => {
      if (projectPath !== state.activeProject) return
      // Reload full note list to stay in sync
      const raw = await window.api.listNotes(projectPath)
      dispatch({ type: 'SET_NOTES', notes: raw as Note[] })
    })
    return unsub
  }, [state.activeProject])

  // Listen for note-deleted events
  useEffect(() => {
    const unsub = window.api.onNoteDeleted(({ noteId }) => {
      dispatch({ type: 'REMOVE_NOTE', noteId })
    })
    return unsub
  }, [])

  // Listen for "load note in main" from pop-out (Open in Editor)
  useEffect(() => {
    const unsub = window.api.onLoadNoteInMain(({ noteId, projectPath }) => {
      if (projectPath !== state.activeProject) return
      dispatch({ type: 'SET_ACTIVE_NOTE', noteId })
    })
    return unsub
  }, [state.activeProject])

  return (
    <AppContext.Provider value={{ state, dispatch, reloadNotes, reloadProjects, showToast, noteById }}>
      {children}
    </AppContext.Provider>
  )
}

/** Must be called inside AppProvider. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
