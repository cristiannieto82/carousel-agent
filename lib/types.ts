export interface SlideFields {
  [key: string]: any
}

export interface Slide {
  id: string
  type: 'hook' | 'content' | 'bigNumber' | 'list' | 'beforeAfter' | 'cta' | 'quote' | 'timeline' | 'pricing' | 'toolSpotlight' | 'statDashboard' | 'iconGrid' | 'processFlow'
  fields: SlideFields
}

export interface Carousel {
  id: string
  name: string
  brandId: string
  slides: Slide[]
  caption?: { text: string; hashtags: string[] }
  createdAt: number
}

export interface Brand {
  id: string
  name: string
  handle: string
  bg: string
  bgGradientStart: string
  card: string
  accent: string
  accentHover: string
  text: string
  text2: string
  muted: string
  border: string
  titleFont: string
  titleWeight: string
  bodyFont: string
  monoFont: string
  logo: string
  mode: 'dark' | 'light'
}
