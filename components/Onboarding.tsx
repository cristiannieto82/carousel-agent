'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface BrandKit {
  name: string
  handle: string
  description: string
  accentColor: string
  mode: 'dark' | 'light'
  logoDataUrl: string
  titleFont: string
  bodyFont: string
  tone: string
  cta: string
  completedAt: number
}

/* ─── Font config ─── */
const FONT_GROUPS: { category: string; fonts: string[] }[] = [
  {
    category: 'Sans-serif',
    fonts: ['Inter', 'Poppins', 'Space Grotesk', 'DM Sans', 'Outfit', 'Sora', 'Manrope', 'Plus Jakarta Sans', 'Montserrat', 'Raleway', 'Open Sans', 'Lato', 'Nunito'],
  },
  {
    category: 'Serif',
    fonts: ['Playfair Display', 'Lora', 'Merriweather', 'Source Serif 4', 'DM Serif Display'],
  },
  {
    category: 'Display',
    fonts: ['Bebas Neue', 'Oswald', 'Righteous'],
  },
  {
    category: 'Mono',
    fonts: ['JetBrains Mono', 'Fira Code', 'Space Mono'],
  },
]

const ALL_FONTS = FONT_GROUPS.flatMap(g => g.fonts)

const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${ALL_FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@400;600;700;900`).join('&')}&display=swap`

/* ─── Tone options ─── */
const TONE_OPTIONS = [
  { id: 'profesional', label: 'Profesional', desc: 'Serio, confiable, corporativo' },
  { id: 'casual', label: 'Casual', desc: 'Cercano, amigable, relajado' },
  { id: 'tecnico', label: 'Tecnico', desc: 'Directo, sin relleno, datos' },
  { id: 'inspiracional', label: 'Inspiracional', desc: 'Motivador, storytelling, emocional' },
  { id: 'provocador', label: 'Provocador', desc: 'Bold, polarizante, rompe esquemas' },
  { id: 'educativo', label: 'Educativo', desc: 'Paso a paso, didactico, claro' },
]

/* ─── Preset colors ─── */
const PRESET_COLORS = [
  '#FF4800', '#FF2D55', '#5856D6', '#007AFF', '#34C759',
  '#FFCC00', '#FF9500', '#AF52DE', '#00C7BE', '#FF3B30',
]

/* ─── Steps ─── */
const STEPS = [
  { title: 'Tu marca', subtitle: 'Nombre y presencia digital' },
  { title: 'Paleta de colores', subtitle: 'Color y modo visual' },
  { title: 'Tipografia', subtitle: 'Fuentes para tu marca' },
  { title: 'Tono de voz', subtitle: 'Como habla tu marca' },
  { title: 'Preview', subtitle: 'Revisa tu brand kit' },
]

/* ─── Color helpers ─── */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

function hexToHsl(hex: string): [number, number, number] {
  let r = 0, g = 0, b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  }
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

/* ─── HSL Color Picker component ─── */
function ColorPicker({
  color,
  onChange,
}: {
  color: string
  onChange: (hex: string) => void
}) {
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(color))
  const [hue, sat, light] = hsl
  const boxRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const draggingBox = useRef(false)
  const draggingHue = useRef(false)
  const [hexInput, setHexInput] = useState(color)

  // Sync external color changes
  useEffect(() => {
    const newHsl = hexToHsl(color)
    setHsl(newHsl)
    setHexInput(color)
  }, [color])

  const updateFromBox = useCallback((clientX: number, clientY: number) => {
    const box = boxRef.current
    if (!box) return
    const rect = box.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const newS = Math.round(x * 100)
    const newL = Math.round((1 - y) * 50 + (1 - x) * (1 - y) * 50)
    // Use HSV-like mapping: top-left=white, top-right=pure hue, bottom=black
    // S = x, V = 1-y, then convert to HSL
    const v = 1 - y
    const sl = v * (1 - x / 2)
    const finalS = sl === 0 || sl === 1 ? 0 : Math.round(((v - sl) / Math.min(sl, 1 - sl)) * 100)
    const finalL = Math.round(sl * 100)
    const newHsl: [number, number, number] = [hue, Math.min(100, finalS), Math.max(0, Math.min(100, finalL))]
    setHsl(newHsl)
    const hex = hslToHex(...newHsl)
    setHexInput(hex)
    onChange(hex)
  }, [hue, onChange])

  const updateFromHueBar = useCallback((clientX: number) => {
    const bar = hueRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newHue = Math.round(x * 360)
    const newHsl: [number, number, number] = [newHue, sat, light]
    setHsl(newHsl)
    const hex = hslToHex(...newHsl)
    setHexInput(hex)
    onChange(hex)
  }, [sat, light, onChange])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      if (draggingBox.current) {
        e.preventDefault()
        updateFromBox(clientX, clientY)
      }
      if (draggingHue.current) {
        e.preventDefault()
        updateFromHueBar(clientX)
      }
    }
    const onUp = () => {
      draggingBox.current = false
      draggingHue.current = false
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [updateFromBox, updateFromHueBar])

  // Compute picker position from HSL
  // Convert HSL -> HSV for box position
  const sl = light / 100
  const sHsl = sat / 100
  const v = sl + sHsl * Math.min(sl, 1 - sl)
  const sV = v === 0 ? 0 : 2 * (1 - sl / v)
  const boxX = Math.max(0, Math.min(1, sV))
  const boxY = Math.max(0, Math.min(1, 1 - v))

  const handleHexInputChange = (val: string) => {
    setHexInput(val)
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const newHsl = hexToHsl(val)
      setHsl(newHsl)
      onChange(val.toUpperCase())
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Gradient box */}
      <div
        ref={boxRef}
        onMouseDown={e => { draggingBox.current = true; updateFromBox(e.clientX, e.clientY) }}
        onTouchStart={e => { draggingBox.current = true; updateFromBox(e.touches[0].clientX, e.touches[0].clientY) }}
        style={{
          width: '100%',
          height: 180,
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          cursor: 'crosshair',
          background: `linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1))',
        }} />
        {/* Picker circle */}
        <div style={{
          position: 'absolute',
          left: `${boxX * 100}%`,
          top: `${boxY * 100}%`,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          background: color,
        }} />
      </div>

      {/* Hue bar */}
      <div
        ref={hueRef}
        onMouseDown={e => { draggingHue.current = true; updateFromHueBar(e.clientX) }}
        onTouchStart={e => { draggingHue.current = true; updateFromHueBar(e.touches[0].clientX) }}
        style={{
          width: '100%',
          height: 12,
          borderRadius: 6,
          background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute',
          left: `${(hue / 360) * 100}%`,
          top: '50%',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          transform: 'translate(-50%, -50%)',
          background: `hsl(${hue}, 100%, 50%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Hex input + swatch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          value={hexInput}
          onChange={e => handleHexInputChange(e.target.value)}
          maxLength={7}
          style={{
            width: 110,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
          background: color,
          border: '1px solid var(--border)',
          flexShrink: 0,
        }} />
      </div>
    </div>
  )
}

/* ─── Main component ─── */
export function Onboarding({ onComplete }: { onComplete: (kit: BrandKit) => void }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  // Step 1: Brand
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [description, setDescription] = useState('')
  const [brandUrl, setBrandUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedColors, setExtractedColors] = useState<string[]>([])

  // Step 2: Colors
  const [accentColor, setAccentColor] = useState('#FF4800')
  const [mode, setMode] = useState<'dark' | 'light'>('dark')

  // Step 3: Logo (handled via extraction or later)
  const [logoDataUrl, setLogoDataUrl] = useState('')
  const [logoName, setLogoName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 3: Fonts
  const [titleFont, setTitleFont] = useState('Inter')
  const [bodyFont, setBodyFont] = useState('Inter')
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // Step 4: Tone
  const [tone, setTone] = useState('profesional')

  // Load Google Fonts when reaching step 2 (typography)
  useEffect(() => {
    if (step >= 2 && !fontsLoaded) {
      const existing = document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)
      if (!existing) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = GOOGLE_FONTS_URL
        document.head.appendChild(link)
      }
      setFontsLoaded(true)
    }
  }, [step, fontsLoaded])

  const handleFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoDataUrl(e.target?.result as string)
      setLogoName(file.name)
    }
    reader.readAsDataURL(file)
  }, [])

  const extractBrand = async () => {
    if (!brandUrl.trim()) return
    setExtracting(true)
    try {
      let url = brandUrl.trim()
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url
      const res = await fetch('/api/extract-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Extract failed')
      const data = await res.json()
      if (data.name && !name.trim()) setName(data.name)
      if (data.description) setDescription(data.description)
      if (data.colors && data.colors.length > 0) {
        setExtractedColors(data.colors)
        setAccentColor(data.colors[0])
      }
      if (data.logoUrl) {
        // Try to load the logo as a data URL
        try {
          const imgRes = await fetch(data.logoUrl)
          const blob = await imgRes.blob()
          const reader = new FileReader()
          reader.onload = (e) => {
            setLogoDataUrl(e.target?.result as string)
            setLogoName('logo-extracted')
          }
          reader.readAsDataURL(blob)
        } catch {
          // Skip logo if fetch fails
        }
      }
    } catch {
      // Silently fail
    } finally {
      setExtracting(false)
    }
  }

  const canNext = () => {
    if (step === 0) return name.trim().length > 0
    return true
  }

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setDirection('next')
      setStep(s => s + 1)
    } else {
      onComplete({
        name: name.trim(),
        handle: handle.trim(),
        description: description.trim(),
        accentColor,
        mode,
        logoDataUrl,
        titleFont,
        bodyFont,
        tone,
        cta: '',
        completedAt: Date.now(),
      })
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection('prev')
      setStep(s => s - 1)
    }
  }

  const animClass = direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 8,
    display: 'block',
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,72,0,0.06), transparent)',
    }}>
      <div className="animate-fade-in-scale" style={{
        width: 520,
        maxWidth: '92vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ padding: '32px 36px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
            }}>
              <span style={{ color: 'var(--text-primary)' }}>carousel</span>
              <span style={{ color: 'var(--accent)' }}>.agent</span>
            </div>
            <div style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-glow)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--accent)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>SETUP</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 24 }}>
            Configura tu marca para generar carruseles perfectos
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
                transition: 'background var(--transition-normal)',
              }} />
            ))}
          </div>

          {/* Step title */}
          <div key={`title-${step}`} className={animClass} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--accent)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 6,
            }}>
              Paso {step + 1} de {STEPS.length}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {STEPS[step].title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {STEPS[step].subtitle}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '0 36px', minHeight: 220 }}>
          <div key={`content-${step}`} className={animClass}>

            {/* ──── Step 0: Tu marca ──── */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Nombre de tu marca *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Cristian Nieto, Futbolin, HeyMark..."
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Handle / usuario (opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', fontSize: 15, pointerEvents: 'none',
                    }}>@</span>
                    <input
                      value={handle}
                      onChange={e => setHandle(e.target.value)}
                      placeholder="tu.marca"
                      style={{ ...inputStyle, paddingLeft: 34 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Descripcion breve (opcional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ej: Plataforma de automatizacion de marketing para creadores de contenido"
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 70,
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* URL extraction */}
                <div>
                  <label style={labelStyle}>URL de tu sitio web (opcional)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={brandUrl}
                      onChange={e => setBrandUrl(e.target.value)}
                      placeholder="https://tumarca.com"
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => { if (e.key === 'Enter') extractBrand() }}
                    />
                    <button
                      onClick={extractBrand}
                      disabled={!brandUrl.trim() || extracting}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: brandUrl.trim() && !extracting ? 'var(--accent)' : 'var(--border)',
                        border: 'none',
                        color: brandUrl.trim() && !extracting ? '#fff' : 'var(--text-muted)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: brandUrl.trim() && !extracting ? 'pointer' : 'not-allowed',
                        transition: 'all var(--transition-fast)',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      {extracting && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{
                          animation: 'spin 1s linear infinite',
                        }}>
                          <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
                        </svg>
                      )}
                      {extracting ? 'Extrayendo...' : 'Extraer datos'}
                    </button>
                  </div>
                </div>

                {/* Logo drop zone */}
                <div>
                  <label style={labelStyle}>Logo (opcional)</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleFileDrop(e.target.files[0]) }}
                  />
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileDrop(e.dataTransfer.files[0]) }}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: logoDataUrl ? '12px 16px' : '20px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      background: dragOver ? 'var(--accent-glow)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                    }}
                  >
                    {logoDataUrl ? (
                      <>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                          background: mode === 'dark' ? 'var(--bg-card)' : '#F5F5F5',
                          padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <img src={logoDataUrl} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{logoName}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click para cambiar</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Arrastra tu logo o haz click
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ──── Step 1: Paleta de colores ──── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Color principal</label>
                  <ColorPicker color={accentColor} onChange={setAccentColor} />
                </div>

                {/* Presets */}
                <div>
                  <label style={labelStyle}>Presets</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => setAccentColor(c)}
                        style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                          background: c,
                          border: accentColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                          transform: accentColor === c ? 'scale(1.1)' : 'scale(1)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = accentColor === c ? 'scale(1.1)' : 'scale(1)')}
                      />
                    ))}
                  </div>
                </div>

                {/* Extracted colors */}
                {extractedColors.length > 0 && (
                  <div>
                    <label style={labelStyle}>Colores de tu web</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {extractedColors.map((c, i) => (
                        <button key={`${c}-${i}`} onClick={() => setAccentColor(c)}
                          style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                            background: c,
                            border: accentColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'transform var(--transition-fast)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode */}
                <div>
                  <label style={labelStyle}>Modo</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['dark', 'light'] as const).map(m => (
                      <button key={m} onClick={() => setMode(m)} style={{
                        flex: 1, padding: '14px 0', borderRadius: 'var(--radius-md)',
                        background: mode === m
                          ? (m === 'dark' ? 'var(--bg-card)' : '#F5F5F5')
                          : 'transparent',
                        border: mode === m ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: mode === m
                          ? (m === 'dark' ? 'var(--text-primary)' : '#111')
                          : 'var(--text-secondary)',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        boxShadow: mode === m ? 'var(--shadow-glow)' : 'none',
                      }}>
                        {m === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── Step 2: Tipografia ──── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Title font */}
                <div>
                  <label style={labelStyle}>Fuente para titulos</label>
                  <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                    {FONT_GROUPS.map(group => (
                      <div key={group.category} style={{ marginBottom: 10 }}>
                        <div style={{
                          fontSize: 9,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          marginBottom: 6,
                        }}>
                          {group.category}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {group.fonts.map(f => (
                            <button key={f} onClick={() => setTitleFont(f)} style={{
                              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
                              background: titleFont === f ? 'var(--accent)' : 'var(--bg-card)',
                              border: titleFont === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                              color: titleFont === f ? '#fff' : 'var(--text-secondary)',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              fontFamily: `'${f}', sans-serif`,
                              transition: 'all var(--transition-fast)',
                            }}
                              onMouseEnter={e => { if (titleFont !== f) e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                              onMouseLeave={e => { if (titleFont !== f) e.currentTarget.style.borderColor = 'var(--border)' }}
                            >{f}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body font */}
                <div>
                  <label style={labelStyle}>Fuente para cuerpo</label>
                  <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                    {FONT_GROUPS.map(group => (
                      <div key={group.category} style={{ marginBottom: 10 }}>
                        <div style={{
                          fontSize: 9,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          marginBottom: 6,
                        }}>
                          {group.category}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {group.fonts.map(f => (
                            <button key={f} onClick={() => setBodyFont(f)} style={{
                              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
                              background: bodyFont === f ? 'var(--accent)' : 'var(--bg-card)',
                              border: bodyFont === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                              color: bodyFont === f ? '#fff' : 'var(--text-secondary)',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              fontFamily: `'${f}', sans-serif`,
                              transition: 'all var(--transition-fast)',
                            }}
                              onMouseEnter={e => { if (bodyFont !== f) e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                              onMouseLeave={e => { if (bodyFont !== f) e.currentTarget.style.borderColor = 'var(--border)' }}
                            >{f}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font preview */}
                <div style={{
                  padding: 16, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    fontSize: 10, color: 'var(--text-dim)',
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                  }}>
                    Preview
                  </div>
                  <div style={{
                    fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6,
                    fontFamily: `'${titleFont}', sans-serif`,
                  }}>
                    {name || 'Tu Marca'}
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                    fontFamily: `'${bodyFont}', sans-serif`,
                  }}>
                    Asi se vera el texto de tus carruseles con la tipografia seleccionada.
                  </div>
                </div>
              </div>
            )}

            {/* ──── Step 3: Tono de voz ──── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TONE_OPTIONS.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', borderRadius: 'var(--radius-md)',
                    background: tone === t.id ? 'var(--accent-glow)' : 'var(--bg-card)',
                    border: tone === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                    onMouseEnter={e => { if (tone !== t.id) e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                    onMouseLeave={e => { if (tone !== t.id) e.currentTarget.style.background = 'var(--bg-card)' }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: tone === t.id ? '5px solid var(--accent)' : '2px solid var(--border)',
                      transition: 'border var(--transition-fast)',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tone === t.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ──── Step 4: Preview ──── */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Mini carousel mockup */}
                <div style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: mode === 'dark' ? '#050505' : '#FFFFFF',
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  minHeight: 200,
                }}>
                  {logoDataUrl && (
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: mode === 'dark' ? '#1A1A1A' : '#F0F0F0',
                      padding: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={logoDataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: mode === 'dark' ? '#F5F5F5' : '#111',
                    fontFamily: `'${titleFont}', sans-serif`,
                    textAlign: 'center',
                  }}>
                    {name || 'Tu Marca'}
                  </div>
                  {handle && (
                    <div style={{
                      fontSize: 13,
                      color: mode === 'dark' ? '#A0A0A0' : '#666',
                      fontFamily: `'${bodyFont}', sans-serif`,
                    }}>
                      @{handle}
                    </div>
                  )}
                  <div style={{
                    fontSize: 15,
                    color: mode === 'dark' ? '#A0A0A0' : '#555',
                    fontFamily: `'${bodyFont}', sans-serif`,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    maxWidth: 320,
                  }}>
                    Texto con <span style={{ color: accentColor, fontWeight: 700 }}>highlights</span> en tu color principal
                  </div>
                  <div style={{
                    marginTop: 8,
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-sm)',
                    background: accentColor,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: `'${bodyFont}', sans-serif`,
                  }}>
                    Call to Action
                  </div>
                </div>

                {/* Summary */}
                <div style={{
                  padding: 16, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    fontSize: 10, color: 'var(--text-dim)',
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
                  }}>
                    Tu Brand Kit
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-block', width: 24, height: 24, borderRadius: 6,
                      background: accentColor,
                    }} />
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 11, color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{accentColor}</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 11, color: 'var(--text-muted)',
                    }}>{mode}</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 11, color: 'var(--text-muted)',
                    }}>{titleFont}</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 11, color: 'var(--text-muted)',
                    }}>{bodyFont}</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 11, color: 'var(--text-muted)',
                    }}>{tone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 36px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 16,
        }}>
          <button
            onClick={goBack}
            disabled={step === 0}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: step === 0 ? '1px solid transparent' : '1px solid var(--border)',
              color: step === 0 ? 'transparent' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Atras
          </button>
          <button
            onClick={goNext}
            disabled={!canNext()}
            style={{
              padding: '12px 32px', borderRadius: 'var(--radius-sm)',
              background: canNext() ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              color: canNext() ? '#fff' : 'var(--text-muted)',
              fontSize: 14, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-fast)',
              boxShadow: canNext() ? 'var(--shadow-glow)' : 'none',
            }}
            onMouseEnter={e => { if (canNext()) e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { if (canNext()) e.currentTarget.style.background = 'var(--accent)' }}
          >
            {step === STEPS.length - 1 ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>

        {/* Spinner keyframe (injected once) */}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
