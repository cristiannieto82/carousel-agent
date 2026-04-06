'use client'

import { useState, useRef, useEffect } from 'react'
import type { BrandKit } from './Onboarding'
import { AgentReplay } from './AgentReplay'
import { ModelBadge } from './ModelBadge'
import { CostDashboard } from './CostDashboard'
import { SlideViewer } from './SlideViewer'
import { CAROUSEL_TEMPLATES } from '@/lib/templates'

interface AgentStep {
  type: 'classify' | 'model' | 'tools' | 'cache' | 'compress' | 'tool_call' | 'done'
  label: string
  detail?: string
}

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

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults?: any[]
  agentSteps?: AgentStep[]
  metrics?: SessionMetrics
  timestamp: number
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

function SlidePreview({ html, onClick }: { html: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 162, height: 202, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0,
        border: '1px solid var(--border)',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        cursor: 'pointer', position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{ width: 1080, height: 1350, transform: 'scale(0.15)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }}
        title="slide preview"
      />
      {/* Expand icon overlay */}
      {onClick && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 22, height: 22, borderRadius: 4,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }} className="slide-expand-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
        </div>
      )}
    </div>
  )
}

const EXPORT_FORMATS = [
  { id: 'instagram', label: 'Instagram', w: 1080, h: 1350, ratio: '4:5' },
  { id: 'tiktok', label: 'TikTok / Reels', w: 1080, h: 1920, ratio: '9:16' },
  { id: 'linkedin', label: 'LinkedIn', w: 1200, h: 1200, ratio: '1:1' },
  { id: 'twitter', label: 'Twitter / X', w: 1200, h: 675, ratio: '16:9' },
]

function DownloadButton({ name, htmlSlides }: { name: string; htmlSlides: string[] }) {
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState('')
  const [showFormats, setShowFormats] = useState(false)

  const handleDownload = async (format: typeof EXPORT_FORMATS[0]) => {
    setDownloading(true)
    setShowFormats(false)
    try {
      const [{ default: JSZip }, { default: html2canvas }] = await Promise.all([
        import('jszip'),
        import('html2canvas'),
      ])
      const zip = new JSZip()

      for (let i = 0; i < htmlSlides.length; i++) {
        setProgress(`${format.label} ${i + 1}/${htmlSlides.length}`)

        const iframe = document.createElement('iframe')
        iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${format.w}px;height:${format.h}px;border:none;`
        document.body.appendChild(iframe)
        iframe.srcdoc = htmlSlides[i]

        await new Promise(r => { iframe.onload = r })
        await iframe.contentDocument!.fonts.ready
        await new Promise(r => setTimeout(r, 800))

        const canvas = await html2canvas(iframe.contentDocument!.body, {
          width: format.w, height: format.h, scale: 2,
          useCORS: true, backgroundColor: null,
        })

        const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'))
        zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, blob)
        document.body.removeChild(iframe)
      }

      setProgress('Empaquetando...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const slug = (name || 'carrusel').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}-${format.id}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
    setDownloading(false)
    setProgress('')
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {/* Main download (Instagram default) */}
        <button
          onClick={() => handleDownload(EXPORT_FORMATS[0])}
          disabled={downloading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
            background: downloading ? 'var(--bg-card)' : 'var(--accent)',
            border: 'none', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: downloading ? 'wait' : 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: downloading ? 'none' : 'var(--shadow-glow)',
          }}
          onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = 'var(--accent-hover)' }}
          onMouseLeave={e => { if (!downloading) e.currentTarget.style.background = 'var(--accent)' }}
        >
          {downloading ? (
            <>
              <span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              {progress}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              PNG ({htmlSlides.length} slides)
            </>
          )}
        </button>
        {/* Format dropdown toggle */}
        <button
          onClick={() => setShowFormats(!showFormats)}
          disabled={downloading}
          style={{
            padding: '10px 8px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            background: downloading ? 'var(--bg-card)' : 'var(--accent)',
            border: 'none', borderLeft: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: downloading ? 'wait' : 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = 'var(--accent-hover)' }}
          onMouseLeave={e => { if (!downloading) e.currentTarget.style.background = 'var(--accent)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: showFormats ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Format dropdown */}
      {showFormats && (
        <div className="animate-fade-in" style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
          minWidth: 200, padding: 4, borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}>
          {EXPORT_FORMATS.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => handleDownload(fmt)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 12px', borderRadius: 4,
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <span style={{ fontWeight: 500 }}>{fmt.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
                {fmt.w}x{fmt.h}
              </span>
            </button>
          ))}
          {/* LinkedIn PDF separator */}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <button
            onClick={async () => {
              setDownloading(true); setShowFormats(false); setProgress('Generando PDF...')
              try {
                const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                  import('html2canvas'),
                  import('jspdf'),
                ])
                // LinkedIn format: 1200x1200, landscape PDF
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 1200] })
                for (let i = 0; i < htmlSlides.length; i++) {
                  setProgress(`PDF ${i + 1}/${htmlSlides.length}`)
                  if (i > 0) pdf.addPage([1200, 1200], 'landscape')
                  const iframe = document.createElement('iframe')
                  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1200px;height:1200px;border:none;'
                  document.body.appendChild(iframe)
                  iframe.srcdoc = htmlSlides[i]
                  await new Promise(r => { iframe.onload = r })
                  await iframe.contentDocument!.fonts.ready
                  await new Promise(r => setTimeout(r, 800))
                  const canvas = await html2canvas(iframe.contentDocument!.body, { width: 1200, height: 1200, scale: 2, useCORS: true, backgroundColor: null })
                  const imgData = canvas.toDataURL('image/png')
                  pdf.addImage(imgData, 'PNG', 0, 0, 1200, 1200)
                  document.body.removeChild(iframe)
                }
                const slug = (name || 'carrusel').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                pdf.save(`${slug}-linkedin.pdf`)
              } catch (err) { console.error('PDF export error:', err) }
              setDownloading(false); setProgress('')
            }}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '8px 12px', borderRadius: 4,
              background: 'transparent', border: 'none', color: '#0077B5',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,119,181,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span>LinkedIn PDF</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>1200x1200</span>
          </button>
        </div>
      )}
    </div>
  )
}

function CaptionBlock({ caption, hashtags }: { caption: string; hashtags: string[] }) {
  const [copied, setCopied] = useState(false)
  const full = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
  return (
    <div className="animate-fade-in-up" style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: 18, marginTop: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Caption</span>
        <button
          onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          style={{
            padding: '4px 12px', borderRadius: 'var(--radius-sm)',
            background: copied ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
            color: copied ? '#22C55E' : 'var(--text-secondary)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{caption}</p>
      <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10 }}>{hashtags.map(h => `#${h}`).join(' ')}</p>
    </div>
  )
}

function VariantDisplay({ variants, topic, onOpenViewer }: { variants: any[]; topic: string; onOpenViewer: (slides: string[], index: number, name: string) => void }) {
  const [selected, setSelected] = useState(0)
  return (
    <div className="animate-fade-in-up" style={{ marginTop: 8 }}>
      <div style={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
      }}>
        A/B Variants — {topic}
      </div>
      {/* Variant tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {variants.map((v: any, i: number) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            background: selected === i ? 'var(--accent)' : 'var(--bg-card)',
            border: `1px solid ${selected === i ? 'var(--accent)' : 'var(--border)'}`,
            color: selected === i ? '#fff' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {v.label}
          </button>
        ))}
      </div>
      {/* Selected variant slides */}
      {variants[selected]?.allPreviews && (
        <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
            {variants[selected].allPreviews.map((html: string, j: number) => <SlidePreview key={j} html={html} onClick={() => onOpenViewer(variants[selected].allPreviews, j, `${topic} - ${variants[selected].label}`)} />)}
          </div>
          <DownloadButton name={`${topic}-variante-${selected + 1}`} htmlSlides={variants[selected].allPreviews} />
        </>
      )}
    </div>
  )
}

const PILLAR_STYLES: Record<string, { color: string; label: string }> = {
  educativo: { color: '#3B82F6', label: 'EDU' },
  storytelling: { color: '#A78BFA', label: 'STORY' },
  social_proof: { color: '#F59E0B', label: 'PROOF' },
  cta: { color: '#EF4444', label: 'CTA' },
  tendencia: { color: '#22C55E', label: 'TREND' },
}

function CalendarDisplay({ calendar, weekLabel, brandName }: { calendar: any[]; weekLabel: string; brandName: string }) {
  return (
    <div className="animate-fade-in-up" style={{ marginTop: 8 }}>
      <div style={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
      }}>
        Content Calendar — {brandName}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{weekLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {calendar.map((day: any, i: number) => {
          const pillar = PILLAR_STYLES[day.pillar] || { color: 'var(--text-muted)', label: '?' }
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 56, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
              }}>
                {day.day.slice(0, 3).toUpperCase()}
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: `${pillar.color}18`, border: `1px solid ${pillar.color}30`,
                fontSize: 9, fontWeight: 700, color: pillar.color,
                fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
              }}>
                {pillar.label}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {day.topic}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Hook: {day.hookIdea}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                {day.slideCount}s
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BrandExtractionDisplay({ data }: { data: any }) {
  if (data.error) return null
  return (
    <div className="animate-fade-in-up" style={{
      marginTop: 8, padding: 14, borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
      }}>
        Brand Extracted — {data.url}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
        {data.brandKit?.name || data.title}
      </div>
      {data.description && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
          {data.description}
        </div>
      )}
      {/* Colors */}
      {data.colors && data.colors.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", width: 52, flexShrink: 0 }}>Colors</span>
          {data.colors.slice(0, 6).map((c: string, i: number) => (
            <div key={i} title={c} style={{
              width: 22, height: 22, borderRadius: 4, background: c,
              border: i === 0 ? '2px solid var(--accent)' : '1px solid var(--border)',
            }} />
          ))}
        </div>
      )}
      {/* Fonts */}
      {data.fonts && data.fonts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", width: 52, flexShrink: 0 }}>Fonts</span>
          {data.fonts.map((f: string, i: number) => (
            <span key={i} style={{
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              fontSize: 10, color: 'var(--text-secondary)',
            }}>
              {f}
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
        Mode: {data.mode} | Accent: {data.suggestedAccent}
      </div>
    </div>
  )
}

const GRADE_COLORS: Record<string, string> = { A: '#22C55E', B: '#84CC16', C: '#F59E0B', D: '#EF4444', F: '#DC2626' }

function EngagementGauge({ data }: { data: any }) {
  const p = data.prediction
  const rate = p.engagementRate
  const benchmark = parseFloat(data.benchmark?.match(/[\d.]+/)?.[0] || '1.92')
  const isAbove = rate > benchmark
  const gaugeColor = rate >= benchmark * 1.3 ? '#22C55E' : rate >= benchmark ? '#F59E0B' : '#EF4444'
  const pctOfMax = Math.min((rate / (benchmark * 2.5)) * 100, 100)

  return (
    <div className="animate-fade-in-up" style={{
      marginTop: 8, padding: 16, borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Engagement Prediction — {data.platform}
        </div>
        <span style={{
          padding: '2px 10px', borderRadius: 'var(--radius-full)',
          background: `${gaugeColor}15`, border: `1px solid ${gaugeColor}30`,
          fontSize: 11, fontWeight: 700, color: gaugeColor,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {isAbove ? 'Above avg' : 'Below avg'}
        </span>
      </div>

      {/* Main gauge */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: gaugeColor, fontFamily: "'JetBrains Mono', monospace" }}>
          {rate}%
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>engagement predicho</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', marginBottom: 14, position: 'relative' }}>
        <div style={{ height: '100%', borderRadius: 3, background: gaugeColor, width: `${pctOfMax}%`, transition: 'width 0.8s ease' }} />
        {/* Benchmark marker */}
        <div style={{
          position: 'absolute', top: -3, left: `${(benchmark / (benchmark * 2.5)) * 100}%`,
          width: 2, height: 12, background: 'var(--text-muted)', borderRadius: 1,
        }} />
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Saves', value: `${p.saveRate}%`, color: '#22C55E' },
          { label: 'Shares', value: `${p.shareRate}%`, color: '#3B82F6' },
          { label: 'Reach', value: p.estimatedReach, color: '#A78BFA' },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {data.tips && data.tips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.tips.map((tip: string, i: number) => (
            <div key={i} style={{
              fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
              paddingLeft: 8, borderLeft: `2px solid ${gaugeColor}`,
            }}>
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreCard({ data }: { data: any }) {
  const dims = data.dimensions
  const gradeColor = GRADE_COLORS[data.grade] || 'var(--text-muted)'
  return (
    <div className="animate-fade-in-up" style={{
      marginTop: 8, padding: 16, borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Content Score — {data.carouselName}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: gradeColor, fontFamily: "'JetBrains Mono', monospace" }}>{data.totalScore}</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
          <span style={{
            marginLeft: 6, padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: `${gradeColor}18`, border: `1px solid ${gradeColor}30`,
            fontSize: 13, fontWeight: 700, color: gradeColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data.grade}
          </span>
        </div>
      </div>
      {/* Dimension bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(dims).map(([key, dim]: [string, any]) => {
          const pct = (dim.score / dim.max) * 100
          const barColor = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444'
          const labels: Record<string, string> = {
            hook_strength: 'Hook', readability: 'Legibilidad', visual_rhythm: 'Ritmo Visual',
            cta_clarity: 'CTA', content_value: 'Valor',
          }
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{labels[key] || key}</span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: barColor, fontWeight: 700 }}>{dim.score}/{dim.max}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: 2, background: barColor, width: `${pct}%`, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{dim.feedback}</div>
            </div>
          )
        })}
      </div>
      {/* Top improvements */}
      {data.topImprovement && data.topImprovement.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Mejoras prioritarias
          </div>
          {data.topImprovement.map((tip: string, i: number) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid var(--accent)', marginBottom: 4 }}>
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const QUICK_ACTIONS = [
  { label: 'Engagement', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', color: '#22C55E', prompt: (id: string) => `Predice el engagement del carrusel ${id} para Instagram` },
  { label: 'Variantes', icon: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3"/><path d="m19 8-7 7-7-7"/>', color: '#F59E0B', prompt: (id: string) => `Genera 2 variantes A/B del carrusel ${id} con hooks diferentes` },
  { label: 'Nuevo hook', icon: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>', color: '#A78BFA', prompt: (id: string) => `Regenera solo el hook del carrusel ${id} con una formula diferente, manteniendo el resto de slides igual` },
  { label: 'LinkedIn', icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>', color: '#0077B5', prompt: (id: string) => `Optimiza el carrusel ${id} para LinkedIn y dame las recomendaciones` },
]

function QuickActions({ carouselId, onAction }: { carouselId: string; onAction: (prompt: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {QUICK_ACTIONS.map((a, i) => (
        <button key={i} onClick={() => onAction(a.prompt(carouselId))}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 'var(--radius-full)',
            background: 'transparent', border: `1px solid ${a.color}25`,
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = a.color + '10'; e.currentTarget.style.borderColor = a.color + '40'; e.currentTarget.style.color = a.color }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = a.color + '25'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: a.icon }} />
          {a.label}
        </button>
      ))}
    </div>
  )
}

function ToolResultDisplay({ results, onOpenViewer, onAction }: { results: any[]; onOpenViewer: (slides: string[], index: number, name: string) => void; onAction: (prompt: string) => void }) {
  return (
    <>
      {results.map((tr, i) => {
        const r = tr.result
        if (!r) return null

        // Engagement Prediction
        if (r.prediction && r.prediction.engagementRate !== undefined) {
          return <EngagementGauge key={i} data={r} />
        }

        // Score Card
        if (r.totalScore !== undefined && r.dimensions) {
          return <ScoreCard key={i} data={r} />
        }

        // A/B Variants
        if (r.variants && r.variantCount) {
          return <VariantDisplay key={i} variants={r.variants} topic={r.topic} onOpenViewer={onOpenViewer} />
        }

        // Content Calendar
        if (r.calendar && r.weekLabel) {
          return <CalendarDisplay key={i} calendar={r.calendar} weekLabel={r.weekLabel} brandName={r.brandName} />
        }

        // Brand Extraction
        if (r.extracted && r.brandKit) {
          return <BrandExtractionDisplay key={i} data={r} />
        }

        if (r.previews) {
          return (
            <div key={i} className="animate-fade-in-up">
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
                {r.previews.map((html: string, j: number) => <SlidePreview key={j} html={html} onClick={() => onOpenViewer(r.previews, j, r.name || 'carrusel')} />)}
              </div>
              <DownloadButton name={r.name || 'carrusel'} htmlSlides={r.previews} />
              {r.caption && <CaptionBlock caption={r.caption.text} hashtags={r.caption.hashtags} />}
              {r.carouselId && <QuickActions carouselId={r.carouselId} onAction={onAction} />}
            </div>
          )
        }

        if (r.allPreviews) {
          return (
            <div key={i} className="animate-fade-in-up">
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
                {r.allPreviews.map((html: string, j: number) => <SlidePreview key={j} html={html} onClick={() => onOpenViewer(r.allPreviews, j, r.carouselName || 'carrusel')} />)}
              </div>
              <DownloadButton name={r.carouselName || 'carrusel'} htmlSlides={r.allPreviews} />
              {r.carouselId && <QuickActions carouselId={r.carouselId} onAction={onAction} />}
            </div>
          )
        }

        if (r.preview) {
          return (
            <div key={i} className="animate-fade-in-up" style={{ padding: '8px 0' }}>
              <SlidePreview html={r.preview} />
            </div>
          )
        }

        if (r.caption && r.hashtags) {
          return <CaptionBlock key={i} caption={r.caption} hashtags={r.hashtags} />
        }

        return null
      })}
    </>
  )
}

function TypingIndicator() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: 'var(--shadow-glow)',
      }}>CA</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '10px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

const CAPABILITIES = [
  {
    icon: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    label: 'Crear carrusel',
    desc: 'Desde un tema o idea',
    color: 'var(--accent)',
    prompt: (b: string) => `Crea un carrusel de 7 slides sobre por que la gente necesita ${b}`,
  },
  {
    icon: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    label: 'Analizar URL',
    desc: 'Extraer marca de un sitio',
    color: '#3B82F6',
    prompt: () => 'Analiza la marca de https://heymark.ai y muestra los colores y fuentes que encontraste',
  },
  {
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M10 4v18"/>',
    label: 'Calendario semanal',
    desc: 'Plan de contenido 5-7 dias',
    color: '#A78BFA',
    prompt: (b: string) => `Genera un calendario de contenido semanal para ${b} con 5 dias balanceados por pilar`,
  },
  {
    icon: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3"/><path d="m19 8-7 7-7-7"/>',
    label: 'Variantes A/B',
    desc: '2-3 hooks diferentes',
    color: '#F59E0B',
    prompt: (b: string) => `Genera 2 variantes A/B de un carrusel sobre los beneficios de ${b} con hooks diferentes`,
  },
  {
    icon: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    label: 'Ideas de hooks',
    desc: '30+ formulas probadas',
    color: '#22C55E',
    prompt: () => 'Sugiereme 5 hooks para un carrusel sobre automatizar marketing con IA',
  },
  {
    icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    label: 'Score de calidad',
    desc: 'Evaluar carrusel /100',
    color: '#EF4444',
    prompt: () => 'Crea un carrusel de 6 slides sobre 3 errores de marketing que cuestan dinero y despues evalualo con score',
  },
  {
    icon: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>',
    label: 'Desde texto',
    desc: 'Articulo o blog a carrusel',
    color: '#06B6D4',
    prompt: () => 'Convierte este texto en un carrusel: "El 73% de las empresas que adoptan IA en su marketing reportan un aumento de 40% en eficiencia. Las herramientas de IA pueden automatizar la creacion de contenido, el analisis de metricas y la segmentacion de audiencias. Sin embargo, el factor humano sigue siendo clave para la estrategia y la creatividad. Las marcas que combinan IA con un tono autentico generan 3x mas engagement que las que automatizan sin personalizar."',
  },
  {
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    label: 'Multi-formato',
    desc: 'IG, TikTok, LinkedIn, X',
    color: '#EC4899',
    prompt: (b: string) => `Crea un carrusel de 5 slides con tips de productividad para la audiencia de ${b}`,
  },
]

function EmptyState({ brandKit, onSuggestionClick }: { brandKit: BrandKit | null; onSuggestionClick: (s: string) => void }) {
  const brandName = brandKit?.name || 'tu marca'

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 20, padding: '0 20px',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 40px rgba(255, 72, 0, 0.2)',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#fff' }}>CA</span>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          {brandKit ? `Hola, ${brandKit.name}` : 'Carousel Agent'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Agente de IA para crear carruseles de Instagram con copy de alta conversion.
        </div>
      </div>

      {brandKit && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
          borderRadius: 'var(--radius-full)', background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: brandKit.accentColor }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{brandKit.name}</span>
          {brandKit.handle && <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>@{brandKit.handle}</span>}
        </div>
      )}

      {/* Capability grid */}
      <div className="stagger-children" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        maxWidth: 560, width: '100%',
      }}>
        {CAPABILITIES.map((cap, i) => (
          <button key={i} onClick={() => onSuggestionClick(cap.prompt(brandName))}
            style={{
              padding: '14px 10px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = cap.color + '40'
              e.currentTarget.style.background = cap.color + '08'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--bg-card)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cap.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: cap.icon }}
            />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{cap.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{cap.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Template presets */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center',
        }}>
          Templates — un click, un carrusel
        </div>
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 8px',
        }}>
          {CAROUSEL_TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => onSuggestionClick(t.examplePrompt(brandName))}
              style={{
                padding: '8px 14px', borderRadius: 'var(--radius-full)',
                background: 'transparent', border: `1px solid ${t.color}20`,
                color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = t.color + '10'; e.currentTarget.style.borderColor = t.color + '40'; e.currentTarget.style.color = t.color }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = t.color + '20'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: t.icon }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
        Ctrl+N nuevo chat / Ctrl+L biblioteca / Ctrl+K focus
      </div>
    </div>
  )
}

export function Chat({ brandKit }: { brandKit: BrandKit | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [viewer, setViewer] = useState<{ slides: string[]; index: number; name: string } | null>(null)
  const [cumulative, setCumulative] = useState<CumulativeMetrics>({
    totalInputTokens: 0, totalOutputTokens: 0, totalCacheReadTokens: 0,
    totalCostUSD: 0, totalCostWithoutOptimizationsUSD: 0, savingsPercent: 0, requestCount: 0,
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: msg, timestamp: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          sessionId: 'main',
          brandKit: brandKit || undefined,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`)
      }

      const data = await res.json()
      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.text || '',
        toolResults: data.toolResults,
        agentSteps: data.agentSteps,
        metrics: data.metrics,
        timestamp: Date.now(),
      }
      setMessages([...newMessages, assistantMsg])

      // Update cumulative metrics
      if (data.metrics) {
        setCumulative(prev => {
          const m = data.metrics as SessionMetrics
          const newTotal = {
            totalInputTokens: prev.totalInputTokens + m.totalInputTokens,
            totalOutputTokens: prev.totalOutputTokens + m.totalOutputTokens,
            totalCacheReadTokens: prev.totalCacheReadTokens + m.totalCacheReadTokens,
            totalCostUSD: prev.totalCostUSD + m.totalCostUSD,
            totalCostWithoutOptimizationsUSD: prev.totalCostWithoutOptimizationsUSD + m.totalCostWithoutOptimizationsUSD,
            requestCount: prev.requestCount + 1,
            savingsPercent: 0,
          }
          newTotal.savingsPercent = newTotal.totalCostWithoutOptimizationsUSD > 0
            ? (1 - newTotal.totalCostUSD / newTotal.totalCostWithoutOptimizationsUSD) * 100
            : 0
          return newTotal
        })
      }
    } catch (err: any) {
      setMessages([...newMessages, {
        id: `e_${Date.now()}`, role: 'assistant',
        content: `Error: ${err.message || 'No se pudo conectar con el agente'}`,
        timestamp: Date.now(),
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Extract model info from the last assistant message's agent steps
  const getModelFromSteps = (steps?: AgentStep[]): { model: string; reason: string } | null => {
    if (!steps) return null
    const modelStep = steps.find(s => s.type === 'model')
    if (!modelStep) return null
    const isHaiku = modelStep.label.includes('Haiku')
    return {
      model: isHaiku ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514',
      reason: modelStep.detail || '',
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        {messages.length === 0 ? (
          <EmptyState brandKit={brandKit} onSuggestionClick={s => sendMessage(s)} />
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className="animate-fade-in-up"
                style={{
                  marginBottom: 24,
                  display: 'flex', gap: 14,
                  animationDelay: `${Math.min(idx * 50, 200)}ms`,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: message.role === 'user'
                    ? 'var(--bg-card)'
                    : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                  border: message.role === 'user' ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: message.role === 'user' ? 'var(--text-secondary)' : '#fff',
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: message.role === 'assistant' ? 'var(--shadow-glow)' : 'none',
                }}>
                  {message.role === 'user' ? 'TU' : 'CA'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, marginBottom: 6,
                    color: message.role === 'user' ? 'var(--text-muted)' : 'var(--accent)',
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {message.role === 'user' ? 'Tu' : 'Carousel Agent'}
                    {message.role === 'assistant' && (() => {
                      const modelInfo = getModelFromSteps(message.agentSteps)
                      return modelInfo ? <ModelBadge model={modelInfo.model} reason={modelInfo.reason} /> : null
                    })()}
                  </div>

                  {/* Agent Replay trace */}
                  {message.agentSteps && message.agentSteps.length > 0 && (
                    <AgentReplay steps={message.agentSteps} />
                  )}

                  {message.content && (
                    <div style={{
                      fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {message.content}
                    </div>
                  )}
                  {message.toolResults && message.toolResults.length > 0 && (
                    <ToolResultDisplay
                      results={message.toolResults}
                      onOpenViewer={(slides, idx, name) => setViewer({ slides, index: idx, name })}
                      onAction={(prompt) => sendMessage(prompt)}
                    />
                  )}
                </div>
              </div>
            ))}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 24px 24px',
        background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <form
            onSubmit={e => { e.preventDefault(); sendMessage() }}
            style={{
              display: 'flex', alignItems: 'flex-end', gap: 10,
              padding: '10px 14px 10px 18px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,72,0,0.05)'
            }}
            onBlur={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe el carrusel que quieres crear..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 0,
                background: 'transparent', border: 'none', color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                resize: 'none', outline: 'none',
                maxHeight: 150, overflow: 'auto',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: loading || !input.trim() ? 'var(--border)' : 'var(--accent)',
                border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition-fast)',
                flexShrink: 0,
              }}
            >
              {loading ? (
                <span className="animate-spin" style={{ display: 'block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
                </svg>
              )}
            </button>
          </form>

          <div style={{
            textAlign: 'center', marginTop: 10,
            fontSize: 11, color: 'var(--text-dim)',
          }}>
            Shift + Enter para nueva linea
          </div>
        </div>
      </div>

      {/* Cost Dashboard */}
      <CostDashboard cumulative={cumulative} />

      {/* Full-screen Slide Viewer */}
      {viewer && (
        <SlideViewer
          slides={viewer.slides}
          initialIndex={viewer.index}
          carouselName={viewer.name}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}
