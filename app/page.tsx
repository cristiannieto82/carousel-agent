'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Chat } from '@/components/Chat'
import { Onboarding, type BrandKit } from '@/components/Onboarding'
import { CarouselLibrary } from '@/components/CarouselLibrary'
import {
  getConversations, getConversation, createConversation,
  updateConversation, updateConversationTitle, deleteConversation,
  getActiveConversationId, setActiveConversationId,
  generateTitle, type Conversation
} from '@/lib/chat-store'

const BRAND_KIT_KEY = 'carousel_agent_brand_kit'

function loadBrandKit(): BrandKit | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BRAND_KIT_KEY)
    if (!raw) return null
    const kit = JSON.parse(raw)
    if (!('description' in kit)) kit.description = ''
    return kit
  } catch { return null }
}

function saveBrandKit(kit: BrandKit) {
  localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(kit))
}

function groupByTime(convs: Conversation[]): { label: string; items: Conversation[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const week = new Date(today); week.setDate(week.getDate() - 7)

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Hoy', items: [] },
    { label: 'Ayer', items: [] },
    { label: 'Ultimos 7 dias', items: [] },
    { label: 'Anteriores', items: [] },
  ]

  for (const c of convs) {
    if (c.updatedAt >= today.getTime()) groups[0].items.push(c)
    else if (c.updatedAt >= yesterday.getTime()) groups[1].items.push(c)
    else if (c.updatedAt >= week.getTime()) groups[2].items.push(c)
    else groups[3].items.push(c)
  }

  return groups.filter(g => g.items.length > 0)
}

type View = 'chat' | 'library'

export default function Home() {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
  const [ready, setReady] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [view, setView] = useState<View>('chat')

  // Sidebar + conversation state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null)

  // Track window width for mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load brand kit + conversations on mount
  useEffect(() => {
    setBrandKit(loadBrandKit())
    const convs = getConversations()
    setConversations(convs)
    const savedActive = getActiveConversationId()
    if (savedActive && convs.some(c => c.id === savedActive)) {
      setActiveConvId(savedActive)
    }
    setReady(true)
  }, [])

  // Sync active conversation ID to localStorage
  useEffect(() => {
    if (ready) {
      setActiveConversationId(activeConvId)
    }
  }, [activeConvId, ready])

  const refreshConversations = useCallback(() => {
    setConversations(getConversations())
  }, [])

  const handleNewChat = useCallback(() => {
    if (!brandKit) return
    const conv = createConversation(brandKit.name)
    setActiveConvId(conv.id)
    refreshConversations()
    setView('chat')
    if (isMobile) setSidebarOpen(false)
  }, [brandKit, refreshConversations, isMobile])

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConvId(id)
    setView('chat')
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id)
    if (activeConvId === id) {
      const remaining = getConversations()
      setActiveConvId(remaining.length > 0 ? remaining[0].id : null)
    }
    refreshConversations()
  }, [activeConvId, refreshConversations])

  const handleMessagesChange = useCallback((messages: any[]) => {
    if (!activeConvId) return
    // Update messages in store
    updateConversation(activeConvId, messages)
    // Auto-generate title from first user message
    const conv = getConversation(activeConvId)
    if (conv && conv.title === 'New conversation' && messages.length > 0) {
      const title = generateTitle(messages as any)
      updateConversationTitle(activeConvId, title)
    }
    refreshConversations()
  }, [activeConvId, refreshConversations])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'n') {
        e.preventDefault()
        handleNewChat()
      }
      if (e.key === 'l') {
        e.preventDefault()
        setView(v => v === 'chat' ? 'library' : 'chat')
      }
      if (e.key === 'k') {
        e.preventDefault()
        setView('chat')
        setTimeout(() => {
          const input = document.querySelector('textarea') as HTMLTextAreaElement | null
          input?.focus()
        }, 50)
      }
      if (e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleNewChat])

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

  // Get active conversation
  const activeConversation = activeConvId ? getConversation(activeConvId) : null
  const grouped = groupByTime(conversations)

  // Main app
  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar overlay on mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 90, transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 260,
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: isMobile ? 100 : 1,
        marginLeft: sidebarOpen ? 0 : -260,
        ...(isMobile ? { marginLeft: 0 } : {}),
      }}>
        {/* Sidebar top: logo + brand */}
        <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
            marginBottom: 10,
          }}>
            <span style={{ color: 'var(--text-primary)' }}>carousel</span>
            <span style={{ color: 'var(--accent)' }}>.agent</span>
          </div>

          {/* Brand pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            marginBottom: 12,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: brandKit.accentColor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {brandKit.name}
            </span>
          </div>

          {/* New chat button */}
          <button
            onClick={handleNewChat}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)', border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Nuevo chat
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {grouped.map(group => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '8px 8px 4px',
              }}>
                {group.label}
              </div>
              {group.items.map(conv => {
                const isActive = conv.id === activeConvId
                const isHovered = conv.id === hoveredConvId
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    onMouseEnter={() => setHoveredConvId(conv.id)}
                    onMouseLeave={() => setHoveredConvId(null)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 4,
                      background: isActive ? 'var(--accent-glow)' : isHovered ? 'var(--bg-card)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'all 0.15s',
                      marginBottom: 1,
                    }}
                  >
                    <span style={{
                      fontSize: 12.5,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                    }}>
                      {conv.title}
                    </span>
                    {(isHovered || isActive) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conv.id)
                        }}
                        style={{
                          width: 22, height: 22, borderRadius: 4,
                          background: 'transparent', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Eliminar conversacion"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 12,
            }}>
              Sin conversaciones aun.
              <br />
              Haz clic en &quot;Nuevo chat&quot; para empezar.
            </div>
          )}
        </div>

        {/* Sidebar bottom: settings */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Configurar marca
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header className="glass" style={{
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', flexShrink: 0,
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Hamburger / sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title="Toggle sidebar"
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
                <path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" />
              </svg>
            </button>
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
          </div>
        </header>

        {/* Content area */}
        {view === 'chat' ? (
          <Chat
            brandKit={brandKit}
            conversationId={activeConvId}
            initialMessages={activeConversation?.messages ?? []}
            onMessagesChange={handleMessagesChange}
          />
        ) : (
          <CarouselLibrary onBack={() => setView('chat')} />
        )}
      </div>
    </div>
  )
}
