import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { Slide } from '../types'

interface PresenterModeProps {
  slides: Slide[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  onExit: () => void
  onIndexChange: (index: number) => void
}

export default function PresenterMode({
  slides, currentIndex, onNext, onPrev, onExit, onIndexChange
}: PresenterModeProps) {
  const [blackScreen, setBlackScreen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = slides[currentIndex]
  const next = slides[currentIndex + 1]
  const progress = slides.length > 1
    ? (currentIndex / (slides.length - 1)) * 100
    : 100

  // Timer
  useEffect(() => {
    startTime.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onExit(); return }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') onNext()
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') onPrev()
      if (e.key === 'b' || e.key === 'B') setBlackScreen(v => !v)
      if (e.key === 'Home') onIndexChange(0)
      if (e.key === 'End') onIndexChange(slides.length - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onNext, onPrev, onExit, slides.length])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (!current) return null

  return (
    <div
      className="presenter-overlay"
      onClick={() => onNext()}
      style={{ cursor: 'pointer' }}
    >
      {/* Black screen overlay */}
      {blackScreen && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: '#000', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 14
          }}
          onClick={e => { e.stopPropagation(); setBlackScreen(false) }}
        >
          Press B or click to restore
        </div>
      )}

      {/* Slide number */}
      <div className="presenter-slide-num">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Progress bar at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: 'rgba(255,255,255,0.1)'
      }}>
        <div style={{
          height: '100%',
          background: 'var(--accent, #58a6ff)',
          width: `${progress}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Main slide */}
      <div
        className="presenter-slide"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="markdown-body"
          style={{ fontSize: '1.25em' }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(current.html)
          }}
        />

        {/* Speaker notes */}
        {current.notes && (
          <div className="notes-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                          letterSpacing: '0.08em', marginBottom: 6,
                          color: 'var(--text-muted)' }}>
              🔒 Speaker Notes
            </div>
            {current.notes}
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className="presenter-controls"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="presenter-btn"
          onClick={onPrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.35 : 1 }}
        >
          ← Prev
        </button>

        <span className="presenter-counter">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          className="presenter-btn"
          onClick={onNext}
          disabled={currentIndex >= slides.length - 1}
          style={{ opacity: currentIndex >= slides.length - 1 ? 0.35 : 1 }}
        >
          Next →
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />

        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
          ⏱ {formatTime(elapsed)}
        </span>

        <button
          className="presenter-btn"
          onClick={() => setBlackScreen(v => !v)}
          title="Black screen (B)"
          style={{ fontSize: 13 }}
        >
          ⬛
        </button>

        <button
          className="presenter-btn"
          onClick={onExit}
          title="Exit (Escape)"
          style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.4)' }}
        >
          ✕ Exit
        </button>
      </div>

      {/* Next slide preview (bottom right, subtle) */}
      {next && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            width: 220,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ marginBottom: 4, textTransform: 'uppercase',
                        letterSpacing: '0.06em', fontSize: 10 }}>
            Next →
          </div>
          <div style={{ fontWeight: 600, fontSize: 12,
                        color: 'rgba(255,255,255,0.7)' }}>
            {next.title}
          </div>
        </div>
      )}

      {/* Keyboard hint — fades after 3 seconds */}
      <KeyboardHint />
    </div>
  )
}

function KeyboardHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.6)', borderRadius: 8,
      padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeOut 0.5s ease 2.5s forwards',
      pointerEvents: 'none'
    }}>
      → Next &nbsp;|&nbsp; ← Prev &nbsp;|&nbsp; B: Black screen &nbsp;|&nbsp; Esc: Exit
    </div>
  )
}
