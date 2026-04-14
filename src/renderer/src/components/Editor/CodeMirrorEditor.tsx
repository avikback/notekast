import React, { useEffect, useRef } from 'react'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

interface CodeMirrorEditorProps {
  value: string
  /** Called after the 2 s autosave debounce. */
  onSave: (value: string) => void
  /** Called immediately (e.g. for Ctrl+S flush path). */
  onChange: (value: string) => void
}

const AUTOSAVE_DELAY = 2000

/**
 * CodeMirror 6 Markdown editor with 2-second autosave debounce.
 * Mounts once per note (key the parent on noteId to force remount on note change).
 */
const CodeMirrorEditor = React.memo<CodeMirrorEditorProps>(({ value, onSave, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)
  const onChangeRef = useRef(onChange)

  // Keep callback refs current without tearing down the editor
  useEffect(() => { onSaveRef.current = onSave }, [onSave])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      const newValue = update.state.doc.toString()
      onChangeRef.current(newValue)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSaveRef.current(newValue)
      }, AUTOSAVE_DELAY)
    })

    const saveKeymap = keymap.of([
      {
        key: 'Ctrl-s',
        mac: 'Cmd-s',
        run: (view) => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          onSaveRef.current(view.state.doc.toString())
          return true
        }
      }
    ])

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        markdown(),
        oneDark,
        syntaxHighlighting(defaultHighlightStyle),
        updateListener,
        EditorView.theme({
          '&': { height: '100%', background: 'var(--bg-primary)' },
          '.cm-scroller': { fontFamily: 'var(--font-family)', fontSize: '18px', lineHeight: '1.6', overflow: 'auto', background: 'var(--bg-primary)' },
          '.cm-content': { padding: '12px 16px', caretColor: 'var(--accent)', color: 'var(--text-primary)', background: 'var(--bg-primary)' },
          '.cm-activeLine': { background: 'rgba(255,255,255,0.04)' },
          '.cm-gutters': { background: 'var(--bg-primary)', border: 'none', color: 'var(--text-muted)' },
          '.cm-activeLineGutter': { background: 'transparent' },
          '&.cm-focused': { outline: 'none' },
          '.cm-cursor': { borderLeftColor: 'var(--accent)' },
          '.cm-selectionBackground': { background: 'var(--accent-tint)' },
          '&.cm-focused .cm-selectionBackground': { background: 'rgba(93,173,163,0.3)' }
        }, { dark: true }),
        EditorView.lineWrapping
      ]
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount once; note changes handled by key prop on parent

  return <div ref={containerRef} style={{ height: '100%', overflow: 'hidden' }} />
})

CodeMirrorEditor.displayName = 'CodeMirrorEditor'
export default CodeMirrorEditor
