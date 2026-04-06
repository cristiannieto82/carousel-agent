'use client'

import { useState, useEffect, useCallback } from 'react'

interface SlideViewerProps {
  slides: string[]
  initialIndex: number
  carouselName: string
  onClose: () => void
}

export function SlideViewer({ slides, initialIndex, carouselName, onClose }: SlideViewerProps) {
  const [current, setCurrent] = useState(initialIndex)

  const prev = useCallback(() => setCurrent(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setCurrent(i => Math.min(slides.length - 1, i + 1)), [slides.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, prev, next])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      {/* Header info */}
      <div style={{
        position: 'absolute', top: 20, left: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
          color: 'rgba(255,255,255,0.5)',
        }}>
          {carouselName}
        </span>
        <span style={{
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.6)',
        }}>
          {current + 1} / {slides.length}
        </span>
      </div>

      {/* Previous arrow */}
      {current > 0 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          style={{
            position: 'absolute', left: 24, zIndex: 10,
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}

      {/* Slide */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, aspectRatio: '1080/1350',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 0 80px rgba(0,0,0,0.5)',
          transition: 'transform 0.3s ease',
        }}
      >
        <iframe
          key={current}
          srcDoc={slides[current]}
          sandbox="allow-same-origin"
          style={{ width: 1080, height: 1350, transform: 'scale(0.389)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }}
          title={`Slide ${current + 1}`}
        />
      </div>

      {/* Next arrow */}
      {current < slides.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          style={{
            position: 'absolute', right: 24, zIndex: 10,
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      )}

      {/* Thumbnail strip */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setCurrent(i) }}
            style={{
              width: current === i ? 24 : 8, height: 8, borderRadius: 4,
              background: current === i ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        color: 'rgba(255,255,255,0.25)',
      }}>
        ESC cerrar / flechas navegar
      </div>
    </div>
  )
}
