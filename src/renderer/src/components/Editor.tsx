import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language'
import type { Theme } from '../types'

interface EditorProps {
  content: string
  theme: Theme
  onChange: (value: string) => void
}

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-editor)',
    color: 'var(--text-primary)',
    height: '100%',
    fontSize: '13.5px'
  },
  '.cm-content': { padding: '16px 0', caretColor: 'var(--accent)' },
  '.cm-line': { padding: '0 20px' },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-editor)',
    color: 'var(--text-muted)',
    border: 'none',
    borderRight: '1px solid var(--border)'
  },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-hover)' },
  '.cm-activeLine': { backgroundColor: 'var(--bg-hover)' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(9,105,218,0.2) !important' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(9,105,218,0.15)', outline: 'none' },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    lineHeight: '1.65'
  }
}, { dark: false })

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-editor)',
    color: 'var(--text-primary)',
    height: '100%',
    fontSize: '13.5px'
  },
  '.cm-content': { padding: '16px 0', caretColor: 'var(--accent)' },
  '.cm-line': { padding: '0 20px' },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-editor)',
    color: 'var(--text-muted)',
    border: 'none',
    borderRight: '1px solid var(--border)'
  },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-hover)' },
  '.cm-activeLine': { backgroundColor: 'var(--bg-hover)' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(88,166,255,0.2) !important' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    lineHeight: '1.65'
  }
}, { dark: true })

function buildExtensions(isDark: boolean, onChange: (value: string) => void) {
  return [
    lineNumbers(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    bracketMatching(),
    foldGutter(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    keymap.of([
      indentWithTab,
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap
    ]),
    isDark ? oneDark : lightTheme,
    isDark ? [] : [],
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    }),
    EditorView.lineWrapping
  ]
}

export default function Editor({ content, theme, onChange }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const contentRef = useRef(content)
  const isDark = theme === 'github-dark' || theme === 'conference'

  // Track latest onChange without recreating editor
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: buildExtensions(isDark, (val) => onChangeRef.current(val))
    })

    const view = new EditorView({
      state,
      parent: containerRef.current
    })

    viewRef.current = view
    contentRef.current = content

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, []) // Only create once

  // Update content from outside (e.g. file open)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentDoc = view.state.doc.toString()
    if (currentDoc === content) return

    // Replace entire document content
    view.dispatch({
      changes: { from: 0, to: currentDoc.length, insert: content }
    })
    contentRef.current = content
  }, [content])

  // Rebuild editor when theme changes (dark/light switch)
  const prevIsDark = useRef(isDark)
  useEffect(() => {
    if (prevIsDark.current === isDark) return
    prevIsDark.current = isDark

    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    view.destroy()

    if (!containerRef.current) return

    const state = EditorState.create({
      doc: currentContent,
      extensions: buildExtensions(isDark, (val) => onChangeRef.current(val))
    })

    const newView = new EditorView({ state, parent: containerRef.current })
    viewRef.current = newView
  }, [isDark])

  return (
    <div
      className="editor-pane"
      ref={containerRef}
      style={{ overflow: 'hidden' }}
    />
  )
}
