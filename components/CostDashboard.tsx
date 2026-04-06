'use client'

import { useState } from 'react'

interface SessionMetrics {
  steps: any[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalCostUSD: number
  totalCostWithoutOptimizationsUSD: number
  savingsPercent: number
}

interface CumulativeMetrics {
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCostUSD: number
  totalCostWithoutOptimizationsUSD: number
  savingsPercent: number
  requestCount: number
}

export function CostDashboard({ cumulative }: { cumulative: CumulativeMetrics }) {
  const [expanded, setExpanded] = useState(false)

  if (cumulative.requestCount === 0) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 100,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ color: cumulative.savingsPercent > 50 ? '#22C55E' : 'var(--accent)', fontWeight: 700 }}>
          ${cumulative.totalCostUSD.toFixed(4)}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {cumulative.savingsPercent > 0 ? `${cumulative.savingsPercent.toFixed(0)}% saved` : ''}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          style={{
            position: 'absolute', bottom: 46, right: 0,
            width: 320, padding: 16, borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Cost Optimization Dashboard
          </div>

          {/* Before/After comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'rgba(255,72,0,0.06)', border: '1px solid rgba(255,72,0,0.15)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Sin optimizar</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FF4800' }}>
                ${cumulative.totalCostWithoutOptimizationsUSD.toFixed(4)}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Con optimizar</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#22C55E' }}>
                ${cumulative.totalCostUSD.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Savings bar */}
          {cumulative.savingsPercent > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Ahorro</span>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>{cumulative.savingsPercent.toFixed(1)}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: '#22C55E',
                  width: `${Math.min(cumulative.savingsPercent, 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}

          {/* Token breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <Row label="Input tokens" value={cumulative.totalInputTokens.toLocaleString()} />
            <Row label="Output tokens" value={cumulative.totalOutputTokens.toLocaleString()} />
            <Row label="Cache read" value={cumulative.totalCacheReadTokens.toLocaleString()} color="#22C55E" />
            <Row label="Requests" value={cumulative.requestCount.toString()} />
          </div>

          {/* Export metrics button */}
          <button
            onClick={() => {
              const report = {
                session: {
                  exportedAt: new Date().toISOString(),
                  requests: cumulative.requestCount,
                  tokens: {
                    input: cumulative.totalInputTokens,
                    output: cumulative.totalOutputTokens,
                    cacheRead: cumulative.totalCacheReadTokens,
                  },
                  cost: {
                    optimized_usd: Number(cumulative.totalCostUSD.toFixed(6)),
                    unoptimized_usd: Number(cumulative.totalCostWithoutOptimizationsUSD.toFixed(6)),
                    savings_percent: Number(cumulative.savingsPercent.toFixed(1)),
                  },
                },
              }
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `carousel-agent-metrics-${Date.now()}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{
              width: '100%', padding: '7px 0', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
              letterSpacing: '0.08em', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Exportar reporte JSON
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{label}</span>
      <span style={{ color: color || 'var(--text-secondary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}
