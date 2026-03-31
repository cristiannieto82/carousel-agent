'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults?: any[]
}

function SlidePreview({ html }: { html: string }) {
  return (
    <div style={{ width: 162, height: 202, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid #1E1E1E' }}>
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{ width: 1080, height: 1350, transform: 'scale(0.15)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none' }}
        title="slide preview"
      />
    </div>
  )
}

function DownloadButton({ name, htmlSlides }: { name: string; htmlSlides: string[] }) {
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState('')

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const [{ default: JSZip }, { default: html2canvas }] = await Promise.all([
        import('jszip'),
        import('html2canvas'),
      ])
      const zip = new JSZip()

      for (let i = 0; i < htmlSlides.length; i++) {
        setProgress(`Renderizando slide ${i + 1}/${htmlSlides.length}...`)

        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;height:1350px;border:none;'
        document.body.appendChild(iframe)
        iframe.srcdoc = htmlSlides[i]

        await new Promise(r => { iframe.onload = r })
        await iframe.contentDocument!.fonts.ready
        await new Promise(r => setTimeout(r, 800))

        const canvas = await html2canvas(iframe.contentDocument!.body, {
          width: 1080, height: 1350, scale: 2,
          useCORS: true, backgroundColor: null,
        })

        const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'))
        zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, blob)
        document.body.removeChild(iframe)
      }

      setProgress('Empaquetando ZIP...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const slug = (name || 'carrusel').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
    setDownloading(false)
    setProgress('')
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 8, marginTop: 12,
        background: downloading ? '#1E1E1E' : '#FF4800', border: 'none', color: '#fff',
        fontSize: 13, fontWeight: 700, cursor: downloading ? 'wait' : 'pointer',
      }}
    >
      {downloading ? progress : `Descargar PNG (${htmlSlides.length} slides)`}
    </button>
  )
}

function CaptionBlock({ caption, hashtags }: { caption: string; hashtags: string[] }) {
  const full = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
  return (
    <div style={{ background: '#0C0C0C', border: '1px solid #1E1E1E', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Caption</span>
        <button
          onClick={() => navigator.clipboard.writeText(full)}
          style={{ padding: '4px 12px', borderRadius: 5, background: '#141414', border: '1px solid #1E1E1E', color: '#A0A0A0', fontSize: 11, cursor: 'pointer' }}
        >
          Copiar
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{caption}</p>
      <p style={{ fontSize: 12, color: '#FF4800', marginTop: 10 }}>{hashtags.map(h => `#${h}`).join(' ')}</p>
    </div>
  )
}

function ToolResultDisplay({ results }: { results: any[] }) {
  return (
    <>
      {results.map((tr, i) => {
        const r = tr.result
        if (!r) return null

        // Full carousel previews (from get_carousel_preview)
        if (r.previews) {
          return (
            <div key={i}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
                {r.previews.map((html: string, j: number) => <SlidePreview key={j} html={html} />)}
              </div>
              <DownloadButton name={r.name || 'carrusel'} htmlSlides={r.previews} />
              {r.caption && <CaptionBlock caption={r.caption.text} hashtags={r.caption.hashtags} />}
            </div>
          )
        }

        // Carousel created (from create_carousel — now has allPreviews)
        if (r.allPreviews) {
          return (
            <div key={i}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
                {r.allPreviews.map((html: string, j: number) => <SlidePreview key={j} html={html} />)}
              </div>
              <DownloadButton name={r.carouselName || 'carrusel'} htmlSlides={r.allPreviews} />
            </div>
          )
        }

        // Single preview (from edit_slide)
        if (r.preview) {
          return (
            <div key={i} style={{ padding: '8px 0' }}>
              <SlidePreview html={r.preview} />
            </div>
          )
        }

        // Caption result
        if (r.caption && r.hashtags) {
          return <CaptionBlock key={i} caption={r.caption} hashtags={r.hashtags} />
        }

        return null
      })}
    </>
  )
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId: 'main' }),
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
      }
      setMessages([...newMessages, assistantMsg])
    } catch (err: any) {
      setMessages([...newMessages, { id: `e_${Date.now()}`, role: 'assistant', content: `Error: ${err.message || 'No se pudo conectar con el agente'}` }])
    }
    setLoading(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: '#FF4800' }}>CA</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>Carousel Agent</div>
              <div style={{ fontSize: 14, color: '#555', maxWidth: 400, lineHeight: 1.6 }}>
                Describe el carrusel que quieres crear y lo genero automaticamente con la marca que elijas.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                'Crea un carrusel de 6 slides para HeyMark sobre por que las agencias son lentas',
                'Haz un carrusel de 5 slides sobre 3 herramientas gratis para emprender',
                'Carrusel de 7 slides para Futbolin sobre como encontrar jugadores cerca',
              ].map((suggestion, i) => (
                <button key={i} onClick={() => setInput(suggestion)}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#0C0C0C', border: '1px solid #1E1E1E', color: '#A0A0A0', fontSize: 12, cursor: 'pointer', maxWidth: 300, textAlign: 'left', lineHeight: 1.4 }}
                >{suggestion}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message: any) => (
          <div key={message.id} style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: message.role === 'user' ? '#1E1E1E' : '#FF4800',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {message.role === 'user' ? 'TU' : 'CA'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: message.role === 'user' ? '#A0A0A0' : '#FF4800', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {message.role === 'user' ? 'Tu' : 'Carousel Agent'}
              </div>
              {message.content && (
                <div style={{ fontSize: 14, color: '#E0E0E0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message.content}</div>
              )}
              {message.toolResults && message.toolResults.length > 0 && <ToolResultDisplay results={message.toolResults} />}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FF4800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>CA</div>
            <div style={{ fontSize: 13, color: '#555', paddingTop: 8 }}>Generando carrusel...</div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #1E1E1E', background: '#0C0C0C' }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe el carrusel que quieres crear..."
            disabled={loading}
            style={{ flex: 1, padding: '14px 18px', borderRadius: 10, background: '#141414', border: '1px solid #1E1E1E', color: '#F5F5F5', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <button type="submit" disabled={loading || !input.trim()}
            style={{ padding: '14px 28px', borderRadius: 10, background: loading || !input.trim() ? '#1E1E1E' : '#FF4800', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}
          >Enviar</button>
        </form>
      </div>
    </div>
  )
}
