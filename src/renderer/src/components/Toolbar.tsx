import type { Theme, ViewMode } from '../types'

interface ToolbarProps {
  fileName: string
  isDirty: boolean
  theme: Theme
  viewMode: ViewMode
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onExport: () => void
  onPresent: () => void
  onThemeChange: (theme: Theme) => void
  onViewModeChange: (mode: ViewMode) => void
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'github-light', label: '☀️ GitHub Light' },
  { value: 'github-dark',  label: '🌑 GitHub Dark' },
  { value: 'minimal',      label: '⬜ Minimal' },
  { value: 'conference',   label: '🎤 Conference' }
]

export default function Toolbar({
  fileName, isDirty, theme, viewMode,
  onNew, onOpen, onSave, onExport, onPresent,
  onThemeChange, onViewModeChange
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button className="toolbar-btn" onClick={onNew} title="New (Ctrl+N)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.5 1.143L14.857 6.5H9.5V1.143zM2 1h6.5v6h6V14a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1zm8 10H6v1h4v-1zm0-3H6v1h4V8z"/>
        </svg>
        New
      </button>

      <button className="toolbar-btn" onClick={onOpen} title="Open (Ctrl+O)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 3.5A1.5 1.5 0 012.5 2h2.764c.958 0 1.76.56 2.311 1.178L8 3.586l.425-.408C8.976 2.56 9.778 2 10.736 2H13.5A1.5 1.5 0 0115 3.5v8.75a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.25V3.5z"/>
        </svg>
        Open
      </button>

      <button className="toolbar-btn" onClick={onSave} title="Save (Ctrl+S)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 1h-11A1.5 1.5 0 001 2.5v11A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0013.5 1zM4 2h5v4H4V2zm7 12H5v-4h6v4z"/>
        </svg>
        {isDirty ? <span className="toolbar-dirty">Save*</span> : 'Save'}
      </button>

      <div className="toolbar-sep" />

      <button
        className={`toolbar-btn ${viewMode === 'document' ? 'active' : ''}`}
        onClick={() => onViewModeChange('document')}
        title="Document view (Ctrl+1)"
      >
        📄 Doc
      </button>

      <button
        className={`toolbar-btn ${viewMode === 'slides' ? 'active' : ''}`}
        onClick={() => onViewModeChange('slides')}
        title="Slide view (Ctrl+2)"
      >
        🖼 Slides
      </button>

      <div className="toolbar-sep" />

      <button className="toolbar-btn" onClick={onExport} title="Export HTML (Ctrl+E)">
        ⬇ Export
      </button>

      <button className="toolbar-btn present" onClick={onPresent} title="Present fullscreen (F5)">
        ▶ Present
      </button>

      <span className="toolbar-title">
        {isDirty && <span className="toolbar-dirty">● </span>}
        {fileName}
      </span>

      <select
        className="theme-select"
        value={theme}
        onChange={e => onThemeChange(e.target.value as Theme)}
        title="Switch theme"
      >
        {THEMES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  )
}
