/** A single zettel note loaded from disk. */
export interface Note {
  /** Luhmann ID, e.g. "1", "1a", "1a2". Immutable after creation. */
  id: string
  title: string
  /** ID of the parent note, or null for root notes. */
  parent: string | null
  tags: string[]
  /** General / peer link IDs. */
  links: string[]
  /** Bibliographic reference strings — preserved but not edited in the UI yet. */
  references: string[]
  /** Raw Markdown body (no frontmatter). */
  body: string
  /** Absolute path to the .md file on disk. */
  filePath: string
  /** Absolute path to the project directory containing this note. */
  projectPath: string
}

/** Shape written/read from YAML frontmatter (no runtime paths). */
export interface NoteFrontmatter {
  id: string
  title: string
  parent: string | null
  tags: string[]
  links: string[]
  references: string[]
}

/** Input for creating a new root notecard. */
export interface CreateNoteInput {
  title: string
  tags: string[]
}

/** Input for spawning a child note. */
export interface SpawnChildInput {
  title: string
  /** Tags to add on top of the inherited parent tags. */
  additionalTags: string[]
  parentId: string
}

export type EditorMode = 'edit' | 'view'

export type PanelView = 'list' | 'graph'

/** Identifies which dialog (if any) is currently open. */
export type DialogType =
  | { kind: 'new-project' }
  | { kind: 'new-notecard' }
  | { kind: 'spawn-child'; parentNote: Note }
  | { kind: 'delete-notecard'; note: Note }
  | { kind: 'change-root' }

/** Identifies which anchored popup (if any) is currently open. */
export type PopupType =
  | { kind: 'project-picker'; anchorRect: DOMRect }
  | { kind: 'tags-editor'; anchorRect: DOMRect; noteId: string }
  | { kind: 'links-editor'; anchorRect: DOMRect; noteId: string }

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error'
}

/** App-wide state managed by AppContext. */
export interface AppState {
  defaultRoot: string
  projects: string[]
  activeProject: string | null
  notes: Note[]
  activeNoteId: string | null
  selectedTags: string[]
  searchQuery: string
  panelView: PanelView
  dialog: DialogType | null
  popup: PopupType | null
  toasts: Toast[]
}

export type AppAction =
  | { type: 'SET_ROOT'; root: string }
  | { type: 'SET_PROJECTS'; projects: string[] }
  | { type: 'SET_ACTIVE_PROJECT'; projectPath: string | null }
  | { type: 'SET_NOTES'; notes: Note[] }
  | { type: 'UPSERT_NOTE'; note: Note }
  | { type: 'REMOVE_NOTE'; noteId: string }
  | { type: 'SET_ACTIVE_NOTE'; noteId: string | null }
  | { type: 'TOGGLE_TAG'; tag: string }
  | { type: 'CLEAR_TAGS' }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_PANEL_VIEW'; view: PanelView }
  | { type: 'SHOW_DIALOG'; dialog: DialogType }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SHOW_POPUP'; popup: PopupType }
  | { type: 'CLOSE_POPUP' }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
