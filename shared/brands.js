import { LOGO_FUTBOLIN, LOGO_HEYMARK } from './brand-logos'

let _bid = 0
export const brandUid = () => `b${++_bid}`

export const BRAND_SHAPE = {
  id: '',
  name: '',
  handle: '',
  bg: '#050505',
  bgGradientStart: '#0E0805',
  card: '#141414',
  accent: '#FF4800',
  accentHover: '#FF5E1A',
  text: '#F5F5F5',
  text2: '#A0A0A0',
  muted: '#555555',
  border: '#1E1E1E',
  titleFont: 'Inter',
  titleWeight: '900',
  bodyFont: 'Inter',
  monoFont: 'JetBrains Mono',
  logo: '',
  mode: 'dark',
}

export const DEFAULT_BRANDS = [
  {
    id: 'cristiannieto',
    name: 'Cristian Nieto',
    handle: 'cristiannieto.dev',
    bg: '#050505',
    bgGradientStart: '#0E0805',
    card: '#141414',
    accent: '#FF4800',
    accentHover: '#FF5E1A',
    text: '#F5F5F5',
    text2: '#A0A0A0',
    muted: '#555555',
    border: '#1E1E1E',
    titleFont: 'Friends',
    titleWeight: '900',
    bodyFont: 'Poppins',
    monoFont: 'JetBrains Mono',
    logo: '',
    mode: 'dark',
  },
  {
    id: 'futbolin',
    name: 'Futbolin',
    handle: 'futbolin.app',
    bg: '#0A0A0A',
    bgGradientStart: '#0A0F0A',
    card: '#1A1A1A',
    accent: '#22C55E',
    accentHover: '#16A34A',
    text: '#FAFAFA',
    text2: '#999999',
    muted: '#555555',
    border: '#2E2E2E',
    titleFont: 'Space Grotesk',
    titleWeight: '700',
    bodyFont: 'Inter',
    monoFont: 'JetBrains Mono',
    logo: LOGO_FUTBOLIN,
    mode: 'dark',
  },
  {
    id: 'heymark',
    name: 'Heymark.ai',
    handle: 'heymark.ai',
    bg: '#FFFFFF',
    bgGradientStart: '#F5F5F7',
    card: '#FFFFFF',
    accent: '#000000',
    accentHover: '#333333',
    text: '#1D1D1F',
    text2: '#86868B',
    muted: '#D2D2D7',
    border: '#D2D2D7',
    titleFont: 'Inter',
    titleWeight: '700',
    bodyFont: 'Inter',
    monoFont: 'SF Mono',
    logo: LOGO_HEYMARK,
    mode: 'light',
  },
]

/* ── Auto-derive full palette from 1 primary color + mode ── */
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

export function deriveColors(primaryHex, mode = 'dark') {
  const [h, s] = hexToHsl(primaryHex)
  if (mode === 'dark') {
    return {
      bg: hslToHex(h, Math.min(s, 8), 2),
      bgGradientStart: hslToHex(h, Math.min(s, 12), 4),
      card: hslToHex(h, Math.min(s, 6), 8),
      accent: primaryHex,
      accentHover: hslToHex(h, s, Math.min(55, hexToHsl(primaryHex)[2] + 10)),
      text: '#F5F5F5',
      text2: '#A0A0A0',
      muted: '#555555',
      border: '#1E1E1E',
    }
  }
  return {
    bg: '#FFFFFF',
    bgGradientStart: hslToHex(h, Math.min(s, 8), 97),
    card: '#FFFFFF',
    accent: primaryHex,
    accentHover: hslToHex(h, s, Math.max(20, hexToHsl(primaryHex)[2] - 10)),
    text: '#1D1D1F',
    text2: '#86868B',
    muted: '#D2D2D7',
    border: '#D2D2D7',
  }
}

export function makeBrand(overrides = {}) {
  return { ...BRAND_SHAPE, id: brandUid(), ...overrides }
}

/* ── Progressive Color Storytelling ──
 * Generates a palette of N accent tones that create visual momentum across slides.
 * Slide 1 (hook): highest intensity
 * Middle slides: subtle variations
 * Last slide (CTA): full intensity return
 */
export function generateColorStory(accentHex, slideCount, mode = 'dark') {
  const [h, s, l] = hexToHsl(accentHex)
  const palette = []

  for (let i = 0; i < slideCount; i++) {
    const progress = slideCount <= 1 ? 1 : i / (slideCount - 1)

    // First and last slides get full accent intensity
    if (i === 0 || i === slideCount - 1) {
      palette.push({
        accent: accentHex,
        glowIntensity: 1.0,
        bgShift: 0,
      })
      continue
    }

    // Middle slides get subtle variations for rhythm
    // Create a wave pattern: slight hue shift + saturation variation
    const wave = Math.sin(progress * Math.PI) // peaks in the middle
    const hueShift = Math.round(wave * 8) // subtle ±8 degree shift
    const satShift = Math.round(wave * -5) // slightly desaturated in middle
    const lightShift = Math.round(wave * 4) // slightly lighter in middle

    const newH = (h + hueShift + 360) % 360
    const newS = Math.max(0, Math.min(100, s + satShift))
    const newL = Math.max(0, Math.min(100, l + lightShift))

    palette.push({
      accent: hslToHex(newH, newS, newL),
      glowIntensity: 0.7 + (0.3 * (1 - wave)), // less glow in middle
      bgShift: Math.round(wave * 2), // subtle bg warmth shift
    })
  }

  return palette
}

/* ── Complementary accent palette ──
 * Generates 3 complementary colors for multi-color slides (iconGrid, statDashboard)
 */
export function generateAccentPalette(accentHex) {
  const [h, s, l] = hexToHsl(accentHex)
  return {
    primary: accentHex,
    secondary: hslToHex((h + 30) % 360, Math.max(s - 10, 20), l),
    tertiary: hslToHex((h + 210) % 360, Math.max(s - 15, 20), Math.min(l + 5, 80)),
    success: hslToHex(142, 70, 45), // green
    warning: hslToHex(38, 92, 50),  // amber
    error: hslToHex(0, 84, 60),     // red
  }
}
