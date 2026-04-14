import React from 'react'

export type IconName =
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'close'
  | 'new-project'
  | 'choose-project'
  | 'external-window'
  | 'spawn-child'
  | 'add-link'
  | 'add-reference'
  | 'tags'
  | 'delete'
  | 'edit-mode'
  | 'view-mode'
  | 'new-notecard'
  | 'graph-view'
  | 'list-view'
  | 'git'
  | 'commit'
  | 'push'
  | 'pull'
  | 'search'
  | 'browse'
  | 'open-in-editor'

interface IconProps {
  /** Which icon to render */
  name: IconName
  /** Size in px applied to both width and height; defaults to 18 */
  size?: number
  className?: string
  style?: React.CSSProperties
}

const _paths: Record<IconName, React.ReactNode> = {
  minimize: <line x1="5" y1="12" x2="19" y2="12" />,

  maximize: <rect x="4" y="4" width="16" height="16" rx="2" />,

  restore: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),

  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),

  'new-project': (
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </>
  ),

  'choose-project': (
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  ),

  'external-window': (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),

  'spawn-child': (
    <>
      <circle cx="12" cy="4" r="2.5" />
      <line x1="12" y1="6.5" x2="12" y2="10" />
      <line x1="12" y1="10" x2="7" y2="14" />
      <circle cx="7" cy="16.5" r="2" />
      <line x1="12" y1="10" x2="17" y2="14" />
      <circle cx="17" cy="16.5" r="2" />
      <line x1="17" y1="14" x2="17" y2="12.5" />
      <line x1="16.25" y1="13.25" x2="17.75" y2="13.25" />
    </>
  ),

  'add-link': (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),

  'add-reference': (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="13" y2="11" />
    </>
  ),

  tags: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  delete: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),

  'edit-mode': (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),

  'view-mode': (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),

  'new-notecard': (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  ),

  'graph-view': (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="4.5" cy="18" r="2.5" />
      <circle cx="19.5" cy="18" r="2.5" />
      <line x1="10.2" y1="6.9" x2="6.3" y2="16.1" />
      <line x1="13.8" y1="6.9" x2="17.7" y2="16.1" />
      <line x1="7" y1="18" x2="17" y2="18" />
    </>
  ),

  'list-view': (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),

  git: (
    <>
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <path d="M15.41 7.41a9 9 0 0 1-5.93 8.16" />
    </>
  ),

  commit: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="2" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
    </>
  ),

  push: (
    <>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
      <line x1="5" y1="19" x2="19" y2="19" />
    </>
  ),

  pull: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
      <line x1="5" y1="5" x2="19" y2="5" />
    </>
  ),

  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),

  browse: (
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <polyline points="16 13 19 16 16 19" />
      <line x1="11" y1="16" x2="19" y2="16" />
    </>
  ),

  'open-in-editor': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="16" y1="12" x2="9" y2="12" />
      <polyline points="12 9 9 12 12 15" />
    </>
  ),
}

/**
 * Renders a named icon as an inline SVG using `currentColor`, so it inherits
 * the parent element's CSS `color`. Defaults to 18×18px.
 */
const Icon: React.FC<IconProps> = ({ name, size = 18, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    style={style}
    aria-hidden="true"
  >
    {_paths[name]}
  </svg>
)

export default Icon
