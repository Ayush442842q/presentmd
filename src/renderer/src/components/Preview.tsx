import { useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import { renderMarkdown, parseFrontMatter } from '../utils/parseMarkdown'
import type { Slide, ViewMode } from '../types'

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose'
})

async function renderMermaidInElement(container: HTMLElement) {
  const diagrams = container.querySelectorAll<HTMLElement>('.mermaid-diagram')
  for (let i = 0; i < diagrams.length; i++) {
    const el = diagrams[i]
    const code = el.textContent || ''
    try {
      const id = `mermaid-${Date.now()}-${i}`
      const { svg } = await mermaid.render(id, code)
      el.innerHTML = svg
      el.style.background = 'transparent'
    } catch (e) {
      el.innerHTML = `<pre style="color:red">Mermaid error: ${e}</pre>`
    }
  }
}

interface PreviewProps {
  viewMode: ViewMode
  content: string
  slides: Slide[]
  currentSlideIndex: number
  onViewModeChange: (mode: ViewMode) => void
  onSlideChange: (index: number) => void
  onNextSlide: () => void
  onPrevSlide: () => void
}

export default function Preview({
  viewMode, content, slides,
  currentSlideIndex, onViewModeChange,
  onSlideChange, onNextSlide, onPrevSlide
}: PreviewProps) {
  const docRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const slideKey = `${currentSlideIndex}-${slides.length}`

  // Sanitize and render the full document
  const docHtml = (() => {
    if (!content) return ''
    const { body } = parseFrontMatter(content)
    // Replace === separators with hr for document view
    const withHr = body.replace(/^===\s*$/gm, '\n---\n')
    const raw = renderMarkdown(withHr)
    return DOMPurify.sanitize(raw, { ADD_TAGS: ['div'], ADD_ATTR: ['class'] })
  })()

  const currentSlide = slides[currentSlideIndex]
  const progress = slides.length > 1
    ? ((currentSlideIndex) / (slides.length - 1)) * 100
    : 100

  // Render mermaid diagrams in document view
  useEffect(() => {
    if (docRef.current && viewMode === 'document') {
      renderMermaidInElement(docRef.current)
    }
  }, [docHtml, viewMode])

  // Render mermaid diagrams in slide view
  useEffect(() => {
    if (slideRef.current && viewMode === 'slides') {
      renderMermaidInElement(slideRef.current)
    }
  }, [currentSlideIndex, viewMode, slides])

  return (
    <div className="preview-pane">
      {/* Mode switcher */}
      <div className="preview-mode-bar">
        <button
          className={`preview-mode-btn ${viewMode === 'document' ? 'active' : ''}`}
          onClick={() => onViewModeChange('document')}
        >
          📄 Document
        </button>
        <button
          className={`preview-mode-btn ${viewMode === 'slides' ? 'active' : ''}`}
          onClick={() => onViewModeChange('slides')}
        >
          🖼 Slides {slides.length > 0 && `(${slides.length})`}
        </button>
      </div>

      {/* Document view */}
      {viewMode === 'document' && (
        <div className="doc-preview" ref={docRef}>
          {content ? (
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />
          ) : (
            <div className="empty-state">
              <span style={{ fontSize: 40 }}>📝</span>
              <span className="empty-state-title">Start writing</span>
              <span className="empty-state-sub">
                Type Markdown in the editor on the left to see a live preview here.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Slide view */}
      {viewMode === 'slides' && (
        <>
          {/* Navigation bar */}
          <div className="slide-nav-bar">
            <button
              className="slide-nav-btn"
              onClick={onPrevSlide}
              disabled={currentSlideIndex === 0}
            >
              ← Prev
            </button>
            <span className="slide-counter">
              {slides.length > 0
                ? `${currentSlideIndex + 1} / ${slides.length}`
                : 'No slides'}
            </span>
            <button
              className="slide-nav-btn"
              onClick={onNextSlide}
              disabled={currentSlideIndex >= slides.length - 1}
            >
              Next →
            </button>
          </div>

          {/* Progress bar */}
          <div className="slide-progress">
            <div
              className="slide-progress-fill"
              style={{ width: slides.length > 0 ? `${progress}%` : '0%' }}
            />
          </div>

          {/* Slide content */}
          <div className="slide-area">
            {slides.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: 40 }}>🖼</span>
                <span className="empty-state-title">No slides yet</span>
                <span className="empty-state-sub">
                  Add <code style={{ background: 'var(--code-bg)', padding: '1px 6px', borderRadius: 3 }}>===</code> on its own line to create slide breaks.
                </span>
              </div>
            ) : currentSlide ? (
              <div key={slideKey} className="slide-card slide-enter" ref={slideRef}>
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(currentSlide.html, { ADD_TAGS: ['div'], ADD_ATTR: ['class'] })
                  }}
                />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
