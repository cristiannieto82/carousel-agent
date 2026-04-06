'use client'

import { useState, useRef, useCallback } from 'react'

export interface BrandKit {
  name: string
  handle: string
  accentColor: string
  mode: 'dark' | 'light'
  logoDataUrl: string
  titleFont: string
  bodyFont: string
  tone: string
  cta: string
  completedAt: number
}

const FONT_OPTIONS = [
  'Inter', 'Poppins', 'Space Grotesk', 'DM Sans', 'Outfit',
  'Sora', 'Manrope', 'Plus Jakarta Sans', 'Satoshi', 'Cabinet Grotesk',
]

const TONE_OPTIONS = [
  { id: 'profesional', label: 'Profesional', desc: 'Serio, confiable, corporativo' },
  { id: 'casual', label: 'Casual', desc: 'Cercano, amigable, relajado' },
  { id: 'tecnico', label: 'Tecnico', desc: 'Directo, sin relleno, datos' },
  { id: 'inspiracional', label: 'Inspiracional', desc: 'Motivador, storytelling, emocional' },
  { id: 'provocador', label: 'Provocador', desc: 'Bold, polarizante, rompe esquemas' },
  { id: 'educativo', label: 'Educativo', desc: 'Paso a paso, didactico, claro' },
]

const PRESET_COLORS = [
  '#FF4800', '#FF2D55', '#5856D6', '#007AFF', '#34C759',
  '#FFCC00', '#FF9500', '#AF52DE', '#00C7BE', '#FF3B30',
]

const STEPS = [
  { title: 'Tu marca', subtitle: 'Nombre y presencia digital' },
  { title: 'Identidad visual', subtitle: 'Color y modo' },
  { title: 'Logo', subtitle: 'Sube tu logo en PNG' },
  { title: 'Tipografia', subtitle: 'Fuentes para tu marca' },
  { title: 'Tono de voz', subtitle: 'Como habla tu marca' },
  { title: 'CTA por defecto', subtitle: 'Llamada a la accion final' },
]

export function Onboarding({ onComplete }: { onComplete: (kit: BrandKit) => void }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [accentColor, setAccentColor] = useState('#FF4800')
  const [customColor, setCustomColor] = useState('')
  const [mode, setMode] = useState<'dark' | 'light'>('dark')
  const [logoDataUrl, setLogoDataUrl] = useState('')
  const [logoName, setLogoName] = useState('')
  const [titleFont, setTitleFont] = useState('Inter')
  const [bodyFont, setBodyFont] = useState('Inter')
  const [tone, setTone] = useState('profesional')
  const [cta, setCta] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const canNext = () => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return true
    if (step === 2) return true // logo optional
    if (step === 3) return true
    if (step === 4) return true
    if (step === 5) return true
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
        accentColor: customColor || accentColor,
        mode,
        logoDataUrl,
        titleFont,
        bodyFont,
        tone,
        cta: cta.trim() || 'Link en bio',
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

  const handleFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoDataUrl(e.target?.result as string)
      setLogoName(file.name)
    }
    reader.readAsDataURL(file)
  }, [])

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
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
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

            {/* Step 0: Name & Handle */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Nombre de tu marca</label>
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
              </div>
            )}

            {/* Step 1: Colors & Mode */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Color principal</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => { setAccentColor(c); setCustomColor('') }}
                        style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                          background: c, border: accentColor === c && !customColor ? `2px solid var(--text-primary)` : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                          transform: accentColor === c && !customColor ? 'scale(1.1)' : 'scale(1)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = accentColor === c && !customColor ? 'scale(1.1)' : 'scale(1)')}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 0, flexShrink: 0 }}>Custom HEX</label>
                    <input
                      value={customColor}
                      onChange={e => setCustomColor(e.target.value)}
                      placeholder="#FF4800"
                      maxLength={7}
                      style={{ ...inputStyle, width: 140, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                    />
                    {customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor) && (
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                        background: customColor, border: '2px solid var(--text-primary)',
                        animation: 'fadeInScale 200ms ease-out',
                      }} />
                    )}
                  </div>
                </div>

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

            {/* Step 2: Logo */}
            {step === 2 && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
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
                    borderRadius: 'var(--radius-lg)',
                    padding: '40px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    background: dragOver ? 'var(--accent-glow)' : 'transparent',
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  {logoDataUrl ? (
                    <>
                      <div style={{
                        width: 80, height: 80, borderRadius: 'var(--radius-md)',
                        background: mode === 'dark' ? 'var(--bg-card)' : '#F5F5F5',
                        padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeInScale 300ms ease-out',
                      }}>
                        <img src={logoDataUrl} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{logoName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click para cambiar</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 32, color: 'var(--text-dim)', lineHeight: 1 }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Arrastra tu logo aqui o haz click
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        PNG transparente recomendado
                      </div>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, textAlign: 'center' }}>
                  Puedes saltar este paso si no tienes logo aun
                </div>
              </div>
            )}

            {/* Step 3: Fonts */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Fuente para titulos</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FONT_OPTIONS.map(f => (
                      <button key={f} onClick={() => setTitleFont(f)} style={{
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                        background: titleFont === f ? 'var(--accent)' : 'var(--bg-card)',
                        border: titleFont === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: titleFont === f ? '#fff' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                        onMouseEnter={e => { if (titleFont !== f) e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                        onMouseLeave={e => { if (titleFont !== f) e.currentTarget.style.borderColor = 'var(--border)' }}
                      >{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Fuente para cuerpo</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FONT_OPTIONS.map(f => (
                      <button key={f} onClick={() => setBodyFont(f)} style={{
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                        background: bodyFont === f ? 'var(--accent)' : 'var(--bg-card)',
                        border: bodyFont === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: bodyFont === f ? '#fff' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                        onMouseEnter={e => { if (bodyFont !== f) e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                        onMouseLeave={e => { if (bodyFont !== f) e.currentTarget.style.borderColor = 'var(--border)' }}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div style={{
                  padding: 16, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                    Preview
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {name || 'Tu Marca'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Asi se vera el texto de tus carruseles con la tipografia seleccionada.
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Tone */}
            {step === 4 && (
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

            {/* Step 5: CTA */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Texto del CTA final</label>
                  <input
                    value={cta}
                    onChange={e => setCta(e.target.value)}
                    placeholder="Ej: Link en bio, Descarga la app, Visita mi web..."
                    style={inputStyle}
                    autoFocus
                  />
                </div>

                {/* Preview card */}
                <div style={{
                  padding: 24, borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                    Tu brand kit
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
                    {logoDataUrl && (
                      <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: mode === 'dark' ? '#1A1A1A' : '#F5F5F5', padding: 4 }}>
                        <img src={logoDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{name || 'Tu Marca'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{
                      display: 'inline-block', width: 28, height: 28, borderRadius: 6,
                      background: customColor || accentColor,
                    }} />
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 12, color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace", lineHeight: '20px',
                    }}>{customColor || accentColor}</span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--bg-primary)', fontSize: 12, color: 'var(--text-muted)',
                      lineHeight: '20px',
                    }}>{mode}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {titleFont} / {bodyFont} / {tone}
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
      </div>
    </div>
  )
}
