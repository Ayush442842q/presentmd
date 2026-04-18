import { useEffect, useCallback, useRef } from 'react'
import { useStore } from './store/useStore'
import { splitIntoSlides } from './utils/splitSlides'
import { parseFrontMatter } from './utils/parseMarkdown'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import PresenterMode from './components/PresenterMode'
import type { Theme, ViewMode } from './types'

export default function App() {
  const {
    file, theme, viewMode, slides, currentSlideIndex, isPresenting,
    sidebarOpen, setFile, setContent, setDirty, setSlides,
    setTheme, setViewMode, setCurrentSlide, setPresenting, nextSlide, prevSlide
  } = useStore()

  const isSaving = useRef(false)

  // Re-parse slides whenever content changes
  useEffect(() => {
    if (!file.content) {
      setSlides([])
      return
    }
    const parsed = splitIntoSlides(file.content)
    setSlides(parsed)
    // Reset slide index if out of range
    if (currentSlideIndex >= parsed.length) {
      setCurrentSlide(Math.max(0, parsed.length - 1))
    }
  }, [file.content])

  // Apply theme from front matter when file loads
  useEffect(() => {
    if (!file.content) return
    const { frontMatter } = parseFrontMatter(file.content)
    if (frontMatter.theme) setTheme(frontMatter.theme as Theme)
    if (frontMatter.mode) setViewMode(frontMatter.mode as ViewMode)
  }, [file.path])

  // Load welcome file on startup
  useEffect(() => {
    const init = async () => {
      const savedTheme = await window.api.storeGet('theme') as Theme | null
      if (savedTheme) setTheme(savedTheme)

      const content = await window.api.getWelcome()
      setFile(null, content)
    }
    init()
  }, [])

  // Menu actions from main process
  useEffect(() => {
    const removeListener = window.api.onMenuAction(async (action) => {
      switch (action) {
        case 'new': handleNew(); break
        case 'open': handleOpen(); break
        case 'save': handleSave(); break
        case 'saveAs': handleSaveAs(); break
        case 'export': handleExport(); break
        case 'present': handlePresent(); break
        case 'viewDocument': setViewMode('document'); break
        case 'viewSlides': setViewMode('slides'); break
      }
    })
    return removeListener
  }, [file])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isPresenting) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') nextSlide()
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide()
        if (e.key === 'Escape') setPresenting(false)
        return
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's' && !e.shiftKey) { e.preventDefault(); handleSave() }
        if (e.key === 's' && e.shiftKey) { e.preventDefault(); handleSaveAs() }
        if (e.key === 'o') { e.preventDefault(); handleOpen() }
        if (e.key === 'n') { e.preventDefault(); handleNew() }
        if (e.key === 'e') { e.preventDefault(); handleExport() }
      }
      if (e.key === 'F5') { e.preventDefault(); handlePresent() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPresenting, file, slides, currentSlideIndex])

  const handleNew = useCallback(() => {
    if (file.isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return
    }
    setFile(null, '')
  }, [file.isDirty])

  const handleOpen = useCallback(async () => {
    if (file.isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return
    }
    const result = await window.api.openFile()
    if (result) setFile(result.path, result.content)
  }, [file.isDirty])

  const handleSave = useCallback(async () => {
    if (isSaving.current) return
    isSaving.current = true
    try {
      if (!file.path) {
        await handleSaveAs()
        return
      }
      const result = await window.api.saveFile(file.path, file.content)
      if (result.success) setDirty(false)
    } finally {
      isSaving.current = false
    }
  }, [file])

  const handleSaveAs = useCallback(async () => {
    const result = await window.api.saveFileAs(file.content)
    if (result) {
      setFile(result.path, file.content)
      setDirty(false)
    }
  }, [file.content])

  const handleExport = useCallback(async () => {
    if (slides.length === 0) {
      alert('No slides to export. Use === to separate slides.')
      return
    }
    const { generateHtmlExport } = await import('./utils/splitSlides')
    const { frontMatter } = parseFrontMatter(file.content)
    const title = frontMatter.title || 'presentation'
    const html = generateHtmlExport(slides, title, theme)
    const success = await window.api.exportHtml(html, title)
    if (success) alert('HTML exported successfully!')
  }, [slides, file.content, theme])

  const handlePresent = useCallback(() => {
    if (slides.length === 0) {
      setViewMode('slides')
      alert('Add === separators to your markdown to create slides.')
      return
    }
    setPresenting(true)
  }, [slides])

  const fileName = file.path
    ? file.path.split(/[\\/]/).pop() || 'Untitled'
    : 'Welcome.md'

  return (
    <div className={`app-root theme-${theme}`}>
      <Toolbar
        fileName={fileName}
        isDirty={file.isDirty}
        theme={theme}
        viewMode={viewMode}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onExport={handleExport}
        onPresent={handlePresent}
        onThemeChange={(t) => { setTheme(t); window.api.storeSet('theme', t) }}
        onViewModeChange={setViewMode}
      />
      <div className="main-content">
        {sidebarOpen && (
          <Sidebar
            slides={slides}
            currentIndex={currentSlideIndex}
            onSelectSlide={setCurrentSlide}
          />
        )}
        <Editor
          content={file.content}
          theme={theme}
          onChange={setContent}
        />
        <Preview
          viewMode={viewMode}
          content={file.content}
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onViewModeChange={setViewMode}
          onSlideChange={setCurrentSlide}
          onNextSlide={nextSlide}
          onPrevSlide={prevSlide}
        />
      </div>
      {isPresenting && (
        <PresenterMode
          slides={slides}
          currentIndex={currentSlideIndex}
          onNext={nextSlide}
          onPrev={prevSlide}
          onExit={() => setPresenting(false)}
          onIndexChange={setCurrentSlide}
        />
      )}
    </div>
  )
}
