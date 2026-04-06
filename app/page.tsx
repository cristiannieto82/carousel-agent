'use client'

import { useState, useEffect } from 'react'
import { Chat } from '@/components/Chat'
import { Onboarding, type BrandKit } from '@/components/Onboarding'
import { CarouselLibrary } from '@/components/CarouselLibrary'

const BRAND_KIT_KEY = 'carousel_agent_brand_kit'

function loadBrandKit(): BrandKit | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BRAND_KIT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveBrandKit(kit: BrandKit) {
  localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(kit))
}

type View = 'chat' | 'library'

export default function Home() {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
  const [ready, setReady] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [view, setView] = useState<View>('chat')

  useEffect(() => {
    setBrandKit(loadBrandKit())
    setReady(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'n') {
        e.preventDefault()
        fetch('/api/chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'main' }) })
        window.location.reload()
      }
      if (e.key === 'l') {
        e.preventDefault()
        setView(v => v === 'chat' ? 'library' : 'chat')
      }
      if (e.key === 'k') {
        e.preventDefault()
        setView('chat')
        // Focus is handled inside Chat component
        setTimeout(() => {
          const input = document.querySelector('textarea') as HTMLTextAreaElement | null
          input?.focus()
        }, 50)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleOnboardingComplete = (kit: BrandKit) => {
    saveBrandKit(kit)
    setBrandKit(kit)
    setShowSettings(false)
  }

  // Loading state
  if (!ready) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="animate-breathe" style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#fff' }}>CA</span>
        </div>
      </div>
    )
  }

  // Onboarding
  if (!brandKit || showSettings) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // Main app
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass" style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
          }}>
            <span style={{ color: 'var(--text-primary)' }}>carousel</span>
            <span style={{ color: 'var(--accent)' }}>.agent</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: brandKit.accentColor }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {brandKit.name}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* View toggle: Chat / Library */}
          <div style={{
            display: 'flex', padding: 2, borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setView('chat')}
              style={{
                padding: '5px 12px', borderRadius: 4,
                background: view === 'chat' ? 'var(--accent)' : 'transparent',
                border: 'none', color: view === 'chat' ? '#fff' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.2s',
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setView('library')}
              style={{
                padding: '5px 12px', borderRadius: 4,
                background: view === 'library' ? 'var(--accent)' : 'transparent',
                border: 'none', color: view === 'library' ? '#fff' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.2s',
              }}
            >
              Biblioteca
            </button>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />

          {/* New chat button */}
          <button
            onClick={() => {
              fetch('/api/chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'main' }) })
              window.location.reload()
            }}
            title="Nuevo chat"
            style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            title="Configurar marca"
            style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content area */}
      {view === 'chat' ? (
        <Chat brandKit={brandKit} />
      ) : (
        <CarouselLibrary onBack={() => setView('chat')} />
      )}
    </div>
  )
}
