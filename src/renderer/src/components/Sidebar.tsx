import type { Slide } from '../types'

interface SidebarProps {
  slides: Slide[]
  currentIndex: number
  onSelectSlide: (index: number) => void
}

export default function Sidebar({ slides, currentIndex, onSelectSlide }: SidebarProps) {
  if (slides.length === 0) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">Slides</div>
        <div style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
          Use <code style={{ background: 'var(--code-bg)', padding: '1px 5px', borderRadius: 3 }}>===</code> on its own line to create slide breaks.
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">Slides — {slides.length}</div>
      <div className="sidebar-slides">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`slide-thumb ${i === currentIndex ? 'active' : ''}`}
            onClick={() => onSelectSlide(i)}
            title={slide.title}
          >
            <span className="slide-thumb-num">{i + 1}</span>
            <span className="slide-thumb-title">{slide.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
