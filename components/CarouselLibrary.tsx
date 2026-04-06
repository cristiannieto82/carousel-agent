'use client'

import { useState, useEffect } from 'react'

interface CarouselItem {
  id: string
  name: string
  brandId: string
  brandName: string
  slideCount: number
  hasCaption: boolean
  thumbnail: string | null
  createdAt: number
}

export function CarouselLibrary({ onBack }: { onBack: () => void }) {
  const [carousels, setCarousels] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCarousels = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/carousels')
      const data = await res.json()
      setCarousels(data.carousels || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchCarousels() }, [])

  const filtered = carousels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.brandName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await fetch('/api/carousels', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carouselId: id }),
    })
    setCarousels(prev => prev.filter(c => c.id !== id))
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} style={{
            width: 34, height: 34, borderRadius: 'var(--radius-sm)',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Biblioteca
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {carousels.length} carrusel{carousels.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          width: 240,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="animate-breathe" style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#fff' }}>CA</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              {carousels.length === 0 ? 'No hay carruseles creados aun' : 'Sin resultados'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {carousels.length === 0 ? 'Crea tu primer carrusel en el chat' : 'Intenta otra busqueda'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(c => (
              <div
                key={c.id}
                className="animate-fade-in-up"
                style={{
                  borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  transition: 'all 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                {/* Thumbnail */}
                <div style={{ width: '100%', aspectRatio: '1080/1350', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  {c.thumbnail && (
                    <iframe
                      srcDoc={c.thumbnail}
                      sandbox="allow-same-origin"
                      style={{
                        width: 1080, height: 1350,
                        transform: 'scale(0.185)',
                        transformOrigin: 'top left',
                        border: 'none', pointerEvents: 'none',
                      }}
                      title={c.name}
                    />
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 4,
                  }}>
                    {c.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        color: 'var(--text-muted)',
                      }}>
                        {c.slideCount}s
                      </span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        color: 'var(--text-muted)',
                      }}>
                        {timeAgo(c.createdAt)}
                      </span>
                      {c.hasCaption && (
                        <>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
                          <span style={{ fontSize: 10, color: 'var(--accent)' }}>caption</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Eliminar"
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: 'transparent', border: 'none',
                        color: 'var(--text-dim)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#EF4444' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
