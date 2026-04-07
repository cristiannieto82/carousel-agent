import { generateId, getCarousel, setCarousel, getLatestCarousel } from './carousel-store'
// @ts-ignore
import { renderSlideHTML } from '../shared/renderers'
// @ts-ignore
import { DEFAULT_BRANDS, deriveColors, makeBrand } from '../shared/brands'
import type { Carousel, Brand } from './types'
import { suggestHooks, getHooksByCategory, HOOK_FORMULAS, HOOK_CATEGORIES } from './hook-formulas'

let customBrand: Brand | null = null

export function registerCustomBrand(kit: {
  name: string; handle: string; accentColor: string; mode: 'dark' | 'light';
  titleFont: string; bodyFont: string; logoDataUrl?: string;
}) {
  const colors = deriveColors(kit.accentColor, kit.mode)
  customBrand = makeBrand({
    id: 'custom',
    name: kit.name,
    handle: kit.handle,
    ...colors,
    titleFont: kit.titleFont,
    titleWeight: '700',
    bodyFont: kit.bodyFont,
    monoFont: 'JetBrains Mono',
    logo: kit.logoDataUrl || '',
    mode: kit.mode,
  }) as Brand
}

function getBrand(brandId: string): Brand {
  if (brandId === 'custom' && customBrand) return customBrand
  return (DEFAULT_BRANDS.find((b: any) => b.id === brandId) || customBrand || DEFAULT_BRANDS[0]) as Brand
}

let _slideId = 0
function slideId() { return `s_${++_slideId}` }

// ── Variant store ──
const variantStore = new Map<string, { topic: string; carouselIds: string[]; labels: string[] }>()

// ── Calendar store ──
const calendarStore = new Map<string, any>()

// ── Anthropic-native tool definitions ──
export const anthropicToolDefs = [
  {
    name: 'create_carousel',
    description: 'Creates a complete Instagram carousel with multiple slides. Use when the user asks to create a new carousel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name/topic of the carousel' },
        brandId: { type: 'string', description: 'Brand ID: cristiannieto, futbolin, heymark, or custom' },
        slides: {
          type: 'array',
          description: 'Array of slides. First should be hook, last should be cta.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['hook', 'content', 'bigNumber', 'list', 'beforeAfter', 'cta'] },
              fields: { type: 'object', description: 'Slide fields matching the type' },
            },
            required: ['type', 'fields'],
          },
        },
      },
      required: ['name', 'brandId', 'slides'],
    },
  },
  {
    name: 'edit_slide',
    description: 'Edits fields of a specific slide in the current carousel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        slideIndex: { type: 'number', description: '0-based index of the slide to edit' },
        updates: { type: 'object', description: 'Fields to update' },
      },
      required: ['carouselId', 'slideIndex', 'updates'],
    },
  },
  {
    name: 'add_slide',
    description: 'Adds a new slide to the carousel at a specific position.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        position: { type: 'number' },
        type: { type: 'string', enum: ['hook', 'content', 'bigNumber', 'list', 'beforeAfter', 'cta'] },
        fields: { type: 'object' },
      },
      required: ['carouselId', 'position', 'type', 'fields'],
    },
  },
  {
    name: 'remove_slide',
    description: 'Removes a slide from the carousel by index.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        slideIndex: { type: 'number' },
      },
      required: ['carouselId', 'slideIndex'],
    },
  },
  {
    name: 'generate_caption',
    description: 'Saves Instagram caption with hashtags for the carousel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        caption: { type: 'string', description: 'Full Instagram caption' },
        hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags without #' },
      },
      required: ['carouselId', 'caption', 'hashtags'],
    },
  },
  {
    name: 'get_carousel_preview',
    description: 'Gets full HTML preview of all slides. Use carouselId="latest" for most recent.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
      },
      required: ['carouselId'],
    },
  },
  // ── NEW: A/B Variants ──
  {
    name: 'generate_variants',
    description: 'Generates 2-3 A/B variants of a carousel with different hooks/approaches. Call create_carousel for each variant first, then call this to group them as variants for comparison.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'The topic/theme of the variants' },
        carouselIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of carousel IDs to group as variants (2-3)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels for each variant, e.g. ["Hook directo", "Hook con pregunta", "Hook con dato"]',
        },
      },
      required: ['topic', 'carouselIds', 'labels'],
    },
  },
  // ── NEW: Content Calendar ──
  {
    name: 'generate_content_calendar',
    description: 'Creates a weekly content calendar with 5-7 carousel ideas organized by content pillars (educativo, storytelling, social proof, CTA, tendencia). Each day has a topic, pillar, hook idea, and suggested slide count.',
    input_schema: {
      type: 'object' as const,
      properties: {
        brandId: { type: 'string' },
        weekLabel: { type: 'string', description: 'e.g. "Semana del 7 al 11 de abril"' },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string', description: 'e.g. "Lunes"' },
              pillar: { type: 'string', enum: ['educativo', 'storytelling', 'social_proof', 'cta', 'tendencia'] },
              topic: { type: 'string' },
              hookIdea: { type: 'string', description: 'Suggested hook text for slide 1' },
              slideCount: { type: 'number' },
            },
            required: ['day', 'pillar', 'topic', 'hookIdea', 'slideCount'],
          },
        },
      },
      required: ['brandId', 'weekLabel', 'days'],
    },
  },
  // ── NEW: Suggest Hooks ──
  {
    name: 'suggest_hooks',
    description: 'Suggests hook formulas for carousel slide 1 based on topic and category. Returns proven hook templates with examples. Categories: curiosity, authority, contrarian, number, story, pain, aspiration, urgency.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'Topic or theme for hook suggestions' },
        category: { type: 'string', enum: ['curiosity', 'authority', 'contrarian', 'number', 'story', 'pain', 'aspiration', 'urgency', 'all'], description: 'Hook category to filter, or "all" for diverse suggestions' },
        count: { type: 'number', description: 'Number of hooks to suggest (default 5)' },
      },
      required: ['topic'],
    },
  },
  // ── NEW: Reorder Slides ──
  {
    name: 'reorder_slides',
    description: 'Reorders slides in a carousel. Provide the new order as an array of current slide indices.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        newOrder: { type: 'array', items: { type: 'number' }, description: 'Array of current slide indices in desired new order. E.g. [0, 2, 1, 3] moves slide 3 before slide 2.' },
      },
      required: ['carouselId', 'newOrder'],
    },
  },
  // ── NEW: Brand Extraction from URL ──
  {
    name: 'extract_brand_from_url',
    description: 'Scrapes a website URL to extract brand colors, fonts, tone, and metadata. Returns a brand kit that can be used to create carousels. Use when the user provides a URL and wants to create content matching that brand.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Website URL to analyze (e.g. https://heymark.ai)' },
      },
      required: ['url'],
    },
  },
  // ── NEW: Carousel from Text ──
  {
    name: 'carousel_from_text',
    description: 'Extracts key points from a block of text (article, blog post, transcript, or scraped URL content) and returns a structured outline ready for create_carousel. Use when the user pastes long text or asks to convert an article into a carousel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sourceText: { type: 'string', description: 'The raw text content to convert into a carousel (article, blog post, transcript, etc.)' },
        sourceUrl: { type: 'string', description: 'Optional: URL to fetch and extract text from. If provided, sourceText is ignored.' },
        slideCount: { type: 'number', description: 'Target number of slides (default 7)' },
        focus: { type: 'string', description: 'Optional focus: "key_points", "quotes", "stats", "steps", or "story"' },
      },
      required: ['sourceText'],
    },
  },
  // ── NEW: Score Carousel ──
  {
    name: 'score_carousel',
    description: 'Analyzes a carousel and scores it on 5 dimensions: hook_strength (0-20), readability (0-20), visual_rhythm (0-20), cta_clarity (0-20), content_value (0-20). Returns total score /100 with specific feedback per dimension. Use after creating a carousel to show quality analysis.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string', description: 'Carousel ID to score, or "latest"' },
      },
      required: ['carouselId'],
    },
  },
  // ── NEW: Engagement Prediction ──
  {
    name: 'predict_engagement',
    description: 'Predicts engagement metrics for a carousel based on hook type, slide count, content patterns, and platform best practices. Returns predicted engagement rate, save rate, share potential, and specific tips. Use after scoring to give the user a complete picture.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string', description: 'Carousel ID to analyze, or "latest"' },
        platform: { type: 'string', enum: ['instagram', 'linkedin', 'tiktok'], description: 'Target platform (default: instagram)' },
      },
      required: ['carouselId'],
    },
  },
  // ── NEW: Batch Edit ──
  {
    name: 'batch_edit_slides',
    description: 'Applies a transformation instruction across ALL slides in a carousel at once. Use for bulk operations like "make all text more concise", "add numbers to every slide", "use stronger action verbs", "shorten all titles". Returns a summary of changes to apply — the agent should then call edit_slide for each changed slide.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        instruction: { type: 'string', description: 'What to change across all slides, e.g. "make concise", "add data", "stronger verbs"' },
      },
      required: ['carouselId', 'instruction'],
    },
  },
  // ── NEW: Platform Optimization ──
  {
    name: 'optimize_for_platform',
    description: 'Analyzes a carousel and returns platform-specific optimization recommendations. Instagram: emotional hooks, save-worthy content, DM-send CTAs. LinkedIn: educational value, professional tone, document-style. TikTok: trending hooks, fast pace, Gen-Z tone. Returns specific changes to make.',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        platform: { type: 'string', enum: ['instagram', 'linkedin', 'tiktok'] },
      },
      required: ['carouselId', 'platform'],
    },
  },
  // ── NEW: Generate Outline ──
  {
    name: 'generate_outline',
    description: 'Creates a text-only outline/structure for a carousel BEFORE generating the visual slides. Returns slide-by-slide plan with types, titles, key points, and suggested framework. The user can review and request changes before committing to create_carousel. Use when the user wants more control over structure.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'Topic or theme for the carousel' },
        slideCount: { type: 'number', description: 'Target number of slides (default 7)' },
        framework: { type: 'string', enum: ['AIDA', 'PAS', 'BAB', 'Story', 'auto'], description: 'Copy framework to use (default: auto)' },
        platform: { type: 'string', enum: ['instagram', 'linkedin', 'tiktok'], description: 'Target platform for optimization' },
      },
      required: ['topic'],
    },
  },
  // ── NEW: Set Carousel Style ──
  {
    name: 'set_carousel_style',
    description: 'Sets the visual background style for all slides in a carousel. Styles: grid (tech/SaaS), dots (minimalist), gradient (premium/luxury), lines (dynamic/aggressive), noise (creative/artistic), waves (organic/wellness), none (ultra-clean solid).',
    input_schema: {
      type: 'object' as const,
      properties: {
        carouselId: { type: 'string' },
        style: { type: 'string', enum: ['grid', 'dots', 'gradient', 'lines', 'noise', 'waves', 'none'], description: 'Background style to apply' },
      },
      required: ['carouselId', 'style'],
    },
  },
]

// ── Tool execution (now async for URL fetching) ──
export async function executeToolCall(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'create_carousel': {
      const { name, brandId, slides } = args
      const carousel: Carousel = {
        id: generateId(),
        name,
        brandId,
        slides: slides.map((s: any) => ({ id: slideId(), type: s.type, fields: s.fields })),
        createdAt: Date.now(),
      }
      setCarousel(carousel)
      const brand = getBrand(brandId)
      const allPreviews = carousel.slides.map((s: any, i: number) =>
        renderSlideHTML(s, i, carousel.slides.length, brand)
      )
      return {
        carouselId: carousel.id,
        carouselName: name,
        slideCount: carousel.slides.length,
        brandName: brand.name,
        allPreviews,
        slideSummary: carousel.slides.map((s: any, i: number) =>
          `Slide ${i + 1}: [${s.type}] ${s.fields.title || s.fields.number || s.fields.badge || ''}`
        ).join('\n'),
      }
    }
    case 'edit_slide': {
      const { carouselId, slideIndex, updates } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      carousel.slides[slideIndex].fields = { ...carousel.slides[slideIndex].fields, ...updates }
      setCarousel(carousel)
      const brand = getBrand(carousel.brandId)
      return { updated: true, slideIndex, preview: renderSlideHTML(carousel.slides[slideIndex], slideIndex, carousel.slides.length, brand) }
    }
    case 'add_slide': {
      const { carouselId, position, type, fields } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      carousel.slides.splice(position, 0, { id: slideId(), type, fields })
      setCarousel(carousel)
      return { added: true, slideCount: carousel.slides.length }
    }
    case 'remove_slide': {
      const { carouselId, slideIndex } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      carousel.slides.splice(slideIndex, 1)
      setCarousel(carousel)
      return { removed: true, slideCount: carousel.slides.length }
    }
    case 'generate_caption': {
      const { carouselId, caption, hashtags } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      carousel.caption = { text: caption, hashtags }
      setCarousel(carousel)
      return { saved: true, caption, hashtags }
    }
    case 'get_carousel_preview': {
      const { carouselId } = args
      const carousel = carouselId === 'latest' ? getLatestCarousel() : getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      const brand = getBrand(carousel.brandId)
      return {
        carouselId: carousel.id,
        name: carousel.name,
        slideCount: carousel.slides.length,
        previews: carousel.slides.map((s: any, i: number) => renderSlideHTML(s, i, carousel.slides.length, brand)),
        caption: carousel.caption,
      }
    }

    // ── A/B Variants ──
    case 'generate_variants': {
      const { topic, carouselIds, labels } = args
      const variantId = `var_${Date.now()}`
      const variants: any[] = []

      for (let i = 0; i < carouselIds.length; i++) {
        const carousel = getCarousel(carouselIds[i])
        if (!carousel) {
          variants.push({ label: labels[i] || `Variante ${i + 1}`, error: 'Carousel not found' })
          continue
        }
        const brand = getBrand(carousel.brandId)
        variants.push({
          label: labels[i] || `Variante ${i + 1}`,
          carouselId: carousel.id,
          carouselName: carousel.name,
          slideCount: carousel.slides.length,
          hookPreview: renderSlideHTML(carousel.slides[0], 0, carousel.slides.length, brand),
          allPreviews: carousel.slides.map((s: any, idx: number) =>
            renderSlideHTML(s, idx, carousel.slides.length, brand)
          ),
        })
      }

      variantStore.set(variantId, { topic, carouselIds, labels })

      return {
        variantId,
        topic,
        variantCount: variants.length,
        variants,
      }
    }

    // ── Content Calendar ──
    case 'generate_content_calendar': {
      const { brandId, weekLabel, days } = args
      const calendarId = `cal_${Date.now()}`
      const brand = getBrand(brandId)

      calendarStore.set(calendarId, { brandId, weekLabel, days, createdAt: Date.now() })

      return {
        calendarId,
        brandName: brand.name,
        weekLabel,
        dayCount: days.length,
        calendar: days,
      }
    }

    // ── Suggest Hooks ──
    case 'suggest_hooks': {
      const { topic, category, count } = args
      if (category && category !== 'all') {
        const hooks = getHooksByCategory(category)
        return {
          category,
          categoryInfo: HOOK_CATEGORIES[category as keyof typeof HOOK_CATEGORIES],
          hooks: hooks.slice(0, count || 5).map(h => ({
            name: h.name,
            template: h.template,
            example: h.example,
            bestFor: h.bestFor,
          })),
          totalAvailable: HOOK_FORMULAS.length,
        }
      }
      const hooks = suggestHooks(topic, count || 5)
      return {
        topic,
        suggestions: hooks.map(h => ({
          category: h.category,
          name: h.name,
          template: h.template,
          example: h.example,
          bestFor: h.bestFor,
        })),
        totalAvailable: HOOK_FORMULAS.length,
        categories: Object.entries(HOOK_CATEGORIES).map(([id, info]) => `${id}: ${info.name} — ${info.description}`),
      }
    }

    // ── Reorder Slides ──
    case 'reorder_slides': {
      const { carouselId, newOrder } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      const reordered = newOrder.map((idx: number) => carousel.slides[idx]).filter(Boolean)
      if (reordered.length !== carousel.slides.length) return { error: 'Invalid order — index count mismatch' }
      carousel.slides = reordered
      setCarousel(carousel)
      const brand = getBrand(carousel.brandId)
      return {
        reordered: true,
        slideCount: carousel.slides.length,
        newSummary: carousel.slides.map((s: any, i: number) =>
          `Slide ${i + 1}: [${s.type}] ${s.fields.title || s.fields.number || s.fields.badge || ''}`
        ).join('\n'),
        allPreviews: carousel.slides.map((s: any, i: number) =>
          renderSlideHTML(s, i, carousel.slides.length, brand)
        ),
      }
    }

    // ── Brand Extraction from URL ──
    case 'extract_brand_from_url': {
      const { url } = args
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarouselAgent/1.0)' },
          signal: AbortSignal.timeout(10000),
        })
        const html = await response.text()

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1].trim() : ''

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
        const description = descMatch ? descMatch[1].trim() : ''

        // Extract OG image
        const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
        const ogImage = ogImgMatch ? ogImgMatch[1] : ''

        // Extract colors from CSS (inline styles and style tags)
        const colorMatches = new Set<string>()
        const hexPattern = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
        let match
        while ((match = hexPattern.exec(html)) !== null) {
          const hex = match[0].toUpperCase()
          // Skip very common/boring colors
          if (!['#FFFFFF', '#FFF', '#000000', '#000', '#333333', '#333', '#666666', '#666', '#999', '#CCC', '#EEE', '#F5F5F5', '#E5E5E5'].includes(hex)) {
            colorMatches.add(hex.length === 4
              ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
              : hex
            )
          }
        }

        // Extract CSS custom properties (--brand-color, --primary, etc.)
        const cssVarPattern = /--(?:brand|primary|accent|main|color)[^:]*:\s*([^;]+)/gi
        while ((match = cssVarPattern.exec(html)) !== null) {
          const val = match[1].trim()
          const hexInVar = val.match(/#[0-9a-fA-F]{3,6}/)
          if (hexInVar) colorMatches.add(hexInVar[0].toUpperCase())
        }

        // Extract fonts
        const fontFamilies = new Set<string>()
        const fontPattern = /font-family:\s*['"]?([^'";,}]+)/gi
        while ((match = fontPattern.exec(html)) !== null) {
          const font = match[1].trim()
          if (!['inherit', 'system-ui', '-apple-system', 'sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica', 'Times New Roman'].includes(font)) {
            fontFamilies.add(font)
          }
        }

        // Google Fonts detection
        const gfontPattern = /fonts\.googleapis\.com\/css2?\?family=([^&"']+)/gi
        while ((match = gfontPattern.exec(html)) !== null) {
          const families = decodeURIComponent(match[1]).split('|')
          families.forEach(f => {
            const name = f.split(':')[0].replace(/\+/g, ' ')
            fontFamilies.add(name)
          })
        }

        // Detect mode (dark vs light) based on body/root background
        const darkBgPattern = /(?:body|:root|html)[^{]*\{[^}]*background(?:-color)?:\s*(?:#(?:0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-3][0-9a-f]{4})|rgb\(\s*\d{1,2}\s*,)/i
        const isDark = darkBgPattern.test(html)

        const extractedColors = Array.from(colorMatches).slice(0, 8)
        const extractedFonts = Array.from(fontFamilies).slice(0, 4)

        return {
          extracted: true,
          url,
          title,
          description: description.slice(0, 200),
          ogImage,
          colors: extractedColors,
          suggestedAccent: extractedColors[0] || '#000000',
          fonts: extractedFonts,
          suggestedTitleFont: extractedFonts[0] || 'Inter',
          suggestedBodyFont: extractedFonts[1] || extractedFonts[0] || 'Inter',
          mode: isDark ? 'dark' : 'light',
          brandKit: {
            name: title.split(/[|\-–]/).map(s => s.trim())[0] || new URL(url).hostname,
            handle: new URL(url).hostname.replace('www.', '').split('.')[0],
            accentColor: extractedColors[0] || '#000000',
            mode: isDark ? 'dark' as const : 'light' as const,
            titleFont: extractedFonts[0] || 'Inter',
            bodyFont: extractedFonts[1] || extractedFonts[0] || 'Inter',
          },
        }
      } catch (err: any) {
        return { error: `No se pudo analizar ${url}: ${err.message}` }
      }
    }

    // ── Carousel from Text ──
    case 'carousel_from_text': {
      const { sourceText, sourceUrl, slideCount = 7, focus } = args
      let text = sourceText

      // If URL provided, fetch and extract text
      if (sourceUrl) {
        try {
          const res = await fetch(sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarouselAgent/1.0)' },
            signal: AbortSignal.timeout(10000),
          })
          const html = await res.text()
          // Strip HTML tags, extract readable text
          text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&[a-z]+;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000)
        } catch (err: any) {
          return { error: `No se pudo extraer texto de ${sourceUrl}: ${err.message}` }
        }
      }

      if (!text || text.length < 50) {
        return { error: 'Texto demasiado corto para generar un carrusel. Necesito al menos 50 caracteres.' }
      }

      // Extract key sentences and structure
      const sentences = text.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20 && s.length < 300)
      const totalSentences = sentences.length

      // Find potential stats/numbers
      const stats = sentences.filter((s: string) => /\d+[%$KMkm]|\d{2,}/.test(s)).slice(0, 3)

      // Find potential quotes (sentences with first person or attribution)
      const quotes = sentences.filter((s: string) => /[""]|dijo|segun|afirm|explic/i.test(s)).slice(0, 2)

      // Determine best focus
      const detectedFocus = focus || (stats.length >= 2 ? 'stats' : quotes.length >= 1 ? 'quotes' : 'key_points')

      // Select key points for carousel
      const keyPoints = sentences.slice(0, Math.min(slideCount * 2, sentences.length))

      return {
        extracted: true,
        sourceLength: text.length,
        totalSentences,
        detectedFocus,
        targetSlides: slideCount,
        keyPoints: keyPoints.slice(0, slideCount + 2),
        stats,
        quotes,
        summary: sentences.slice(0, 3).join('. ') + '.',
        instruction: `Usa estos puntos clave para crear un carrusel de ${slideCount} slides. El primer slide debe ser un hook basado en el dato mas impactante. El ultimo slide debe ser CTA. Aplica el framework PAS o AIDA segun el contenido.`,
      }
    }

    // ── Score Carousel ──
    case 'score_carousel': {
      const { carouselId } = args
      const carousel = carouselId === 'latest' ? getLatestCarousel() : getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }

      const slides = carousel.slides
      const total = slides.length

      // 1. Hook strength (0-20)
      let hookScore = 0
      let hookFeedback = ''
      const hookSlide = slides[0]
      if (hookSlide?.type === 'hook') {
        hookScore += 8 // Has a dedicated hook slide
        const title = hookSlide.fields?.title || ''
        if (/\d/.test(title)) { hookScore += 4; hookFeedback += 'Tiene numero en el hook (bien). ' }
        else hookFeedback += 'Agregar un numero al hook aumentaria engagement. '
        if (title.length > 10 && title.length < 80) { hookScore += 4; hookFeedback += 'Largo de titulo adecuado. ' }
        else hookFeedback += 'El titulo del hook deberia tener 10-80 caracteres. '
        if (hookSlide.fields?.badge) { hookScore += 2; hookFeedback += 'Badge presente. ' }
        if (hookSlide.fields?.accentLine) { hookScore += 2; hookFeedback += 'Accent line presente. ' }
      } else {
        hookFeedback = 'El primer slide no es tipo hook. Esto reduce engagement significativamente.'
      }
      hookScore = Math.min(20, hookScore)

      // 2. Readability (0-20)
      let readScore = 0
      let readFeedback = ''
      let totalTextLength = 0
      let longSlides = 0
      for (const s of slides) {
        const text = Object.values(s.fields || {}).filter(v => typeof v === 'string').join(' ')
        totalTextLength += text.length
        if (text.length > 200) longSlides++
      }
      const avgTextPerSlide = totalTextLength / total
      if (avgTextPerSlide < 120) { readScore += 10; readFeedback += 'Densidad de texto optima. ' }
      else if (avgTextPerSlide < 180) { readScore += 6; readFeedback += 'Texto un poco denso en algunos slides. ' }
      else { readScore += 2; readFeedback += 'Demasiado texto por slide. Reducir a 3-4 lineas max. ' }
      if (longSlides === 0) { readScore += 5; readFeedback += 'Ningun slide sobrecargado. ' }
      else readFeedback += `${longSlides} slide(s) con demasiado texto. `
      if (total >= 5 && total <= 9) { readScore += 5; readFeedback += `${total} slides es un rango ideal. ` }
      else if (total < 5) readFeedback += 'Muy pocos slides. 5-9 es el rango ideal. '
      else readFeedback += 'Muchos slides. Considerar condensar a 7-9. '
      readScore = Math.min(20, readScore)

      // 3. Visual rhythm (0-20)
      let rhythmScore = 0
      let rhythmFeedback = ''
      const types = slides.map(s => s.type)
      const uniqueTypes = new Set(types).size
      if (uniqueTypes >= 3) { rhythmScore += 8; rhythmFeedback += 'Buena variedad de tipos de slide. ' }
      else if (uniqueTypes >= 2) { rhythmScore += 4; rhythmFeedback += 'Poca variedad. Mezclar mas tipos (bigNumber, list, beforeAfter). ' }
      else { rhythmFeedback += 'Todos los slides son del mismo tipo. Falta ritmo visual. ' }
      // Check for consecutive same types
      let consecutive = 0
      for (let i = 1; i < types.length; i++) { if (types[i] === types[i - 1]) consecutive++ }
      if (consecutive === 0) { rhythmScore += 6; rhythmFeedback += 'Sin tipos consecutivos repetidos. ' }
      else rhythmFeedback += `${consecutive} par(es) de slides consecutivos del mismo tipo. `
      // Has bigNumber?
      if (types.includes('bigNumber')) { rhythmScore += 3; rhythmFeedback += 'Usa bigNumber para impacto visual. ' }
      // Has list or beforeAfter?
      if (types.includes('list') || types.includes('beforeAfter')) { rhythmScore += 3; rhythmFeedback += 'Incluye slide tipo lista/comparacion. ' }
      rhythmScore = Math.min(20, rhythmScore)

      // 4. CTA clarity (0-20)
      let ctaScore = 0
      let ctaFeedback = ''
      const lastSlide = slides[total - 1]
      if (lastSlide?.type === 'cta') {
        ctaScore += 10
        if (lastSlide.fields?.buttonText) { ctaScore += 5; ctaFeedback += `CTA: "${lastSlide.fields.buttonText}". ` }
        else ctaFeedback += 'Falta texto del boton. '
        if (lastSlide.fields?.title) { ctaScore += 3; ctaFeedback += 'Tiene titulo de cierre. ' }
        if (lastSlide.fields?.brandWhite || lastSlide.fields?.brandOrange) { ctaScore += 2; ctaFeedback += 'Branding presente. ' }
      } else {
        ctaFeedback = 'El ultimo slide no es CTA. Esto reduce conversion drasticamente.'
      }
      // Has caption?
      if (carousel.caption) { ctaScore = Math.min(20, ctaScore + 2); ctaFeedback += 'Caption generado. ' }
      else ctaFeedback += 'Sin caption. Generar caption con hashtags aumenta alcance. '
      ctaScore = Math.min(20, ctaScore)

      // 5. Content value (0-20)
      let valueScore = 0
      let valueFeedback = ''
      // Check for concrete data (numbers)
      const slidesWithNumbers = slides.filter(s => {
        const text = JSON.stringify(s.fields || {})
        return /\$[\d,]+|\d+%|\d+[KkMm]\b/.test(text)
      }).length
      if (slidesWithNumbers >= 2) { valueScore += 8; valueFeedback += `${slidesWithNumbers} slides con datos concretos. ` }
      else if (slidesWithNumbers >= 1) { valueScore += 4; valueFeedback += 'Solo 1 slide con datos. Agregar mas numeros. ' }
      else valueFeedback += 'Sin datos concretos. Numeros y cifras aumentan credibilidad. '
      // Actionable content?
      const actionableSlides = slides.filter(s => {
        const text = JSON.stringify(s.fields || {}).toLowerCase()
        return /paso|tip|consejo|herramienta|estrategia|metodo|framework/i.test(text)
      }).length
      if (actionableSlides >= 2) { valueScore += 6; valueFeedback += 'Contenido accionable. ' }
      else valueFeedback += 'Agregar tips o pasos accionables aumenta guardados. '
      // Story elements?
      const hasStory = slides.some(s => {
        const text = JSON.stringify(s.fields || {}).toLowerCase()
        return /historia|cuando|descubr|aprend|error|logr/i.test(text)
      })
      if (hasStory) { valueScore += 6; valueFeedback += 'Tiene elementos de storytelling. ' }
      else valueFeedback += 'Agregar elementos narrativos mejora conexion. '
      valueScore = Math.min(20, valueScore)

      const totalScore = hookScore + readScore + rhythmScore + ctaScore + valueScore
      const grade = totalScore >= 85 ? 'A' : totalScore >= 70 ? 'B' : totalScore >= 55 ? 'C' : totalScore >= 40 ? 'D' : 'F'

      return {
        carouselId: carousel.id,
        carouselName: carousel.name,
        slideCount: total,
        totalScore,
        grade,
        dimensions: {
          hook_strength: { score: hookScore, max: 20, feedback: hookFeedback.trim() },
          readability: { score: readScore, max: 20, feedback: readFeedback.trim() },
          visual_rhythm: { score: rhythmScore, max: 20, feedback: rhythmFeedback.trim() },
          cta_clarity: { score: ctaScore, max: 20, feedback: ctaFeedback.trim() },
          content_value: { score: valueScore, max: 20, feedback: valueFeedback.trim() },
        },
        topImprovement: [hookFeedback, readFeedback, rhythmFeedback, ctaFeedback, valueFeedback]
          .flatMap(f => f.split('. ').filter(s => s.includes('Agregar') || s.includes('Falta') || s.includes('Sin ') || s.includes('Demasiado') || s.includes('Reducir')))
          .slice(0, 3),
      }
    }

    // ── Engagement Prediction ──
    case 'predict_engagement': {
      const { carouselId, platform = 'instagram' } = args
      const carousel = carouselId === 'latest' ? getLatestCarousel() : getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }

      const slides = carousel.slides
      const total = slides.length
      const hookSlide = slides[0]
      const ctaSlide = slides[total - 1]

      // Base engagement rates by platform (2026 data)
      const baseRates: Record<string, number> = { instagram: 1.92, linkedin: 6.60, tiktok: 4.50 }
      let predicted = baseRates[platform] || 1.92

      // Slide count modifier (8-10 optimal for IG, 5-8 for LinkedIn)
      if (platform === 'instagram') {
        if (total >= 7 && total <= 10) predicted *= 1.15
        else if (total >= 5) predicted *= 1.0
        else predicted *= 0.85
      } else if (platform === 'linkedin') {
        if (total >= 5 && total <= 8) predicted *= 1.12
        else predicted *= 0.90
      }

      // Hook quality modifier
      if (hookSlide?.type === 'hook') {
        const title = (hookSlide.fields?.title || '').toLowerCase()
        if (/\d/.test(title)) predicted *= 1.18 // Numbers in hook
        if (title.length > 5 && title.length < 60) predicted *= 1.05 // Good length
        if (/\?/.test(title)) predicted *= 1.08 // Question hooks
      } else {
        predicted *= 0.72 // No dedicated hook = major penalty
      }

      // Content value modifiers
      const slidesWithData = slides.filter(s => /\$[\d,]+|\d+%|\d+[KkMm]\b/.test(JSON.stringify(s.fields || {}))).length
      if (slidesWithData >= 3) predicted *= 1.22
      else if (slidesWithData >= 1) predicted *= 1.08

      // Visual variety modifier
      const uniqueTypes = new Set(slides.map(s => s.type)).size
      if (uniqueTypes >= 4) predicted *= 1.10
      else if (uniqueTypes <= 2) predicted *= 0.90

      // CTA modifier
      if (ctaSlide?.type === 'cta') {
        predicted *= 1.06
        const btnText = (ctaSlide.fields?.buttonText || '').toLowerCase()
        if (/envi|compart|manda|dm/i.test(btnText)) predicted *= 1.15 // Send/share CTAs boost reach
      }

      // Caption modifier
      if (carousel.caption) predicted *= 1.05

      // Clamp to realistic range
      predicted = Math.min(predicted, platform === 'linkedin' ? 12.0 : 5.5)

      // Derived metrics
      const saveRate = predicted * (platform === 'instagram' ? 0.35 : 0.15)
      const shareRate = predicted * (platform === 'instagram' ? 0.12 : platform === 'linkedin' ? 0.25 : 0.18)

      // Platform-specific tips
      const tips: string[] = []
      if (platform === 'instagram') {
        if (!carousel.caption) tips.push('Agrega caption con CTA a "guardar" o "enviar a alguien"')
        if (total < 7) tips.push(`Aumenta a 8-10 slides (tienes ${total}). Mas slides = mas dwell time = mas reach`)
        if (slidesWithData < 2) tips.push('Agrega mas datos/numeros concretos. Aumentan saves un 22%')
        if (ctaSlide?.type === 'cta' && !/envi|compart|manda/i.test(ctaSlide.fields?.buttonText || '')) {
          tips.push('Cambia el CTA a "Envia esto a alguien que lo necesite". DM sends son la senal mas potente del algoritmo')
        }
      } else if (platform === 'linkedin') {
        if (total > 8) tips.push('LinkedIn funciona mejor con 5-8 slides. Condensa el contenido')
        tips.push('Agrega un primer comentario tipo pregunta para generar debate')
        if (slidesWithData < 2) tips.push('LinkedIn premia datos y estadisticas. Agrega mas numeros')
      } else if (platform === 'tiktok') {
        if (total > 8) tips.push('TikTok carousels optimos: 5-7 slides, rapido y visual')
        tips.push('Agrega musica trending al publicar. Empuja el carousel al feed de Reels')
      }

      return {
        carouselId: carousel.id,
        platform,
        prediction: {
          engagementRate: Number(predicted.toFixed(2)),
          saveRate: Number(saveRate.toFixed(2)),
          shareRate: Number(shareRate.toFixed(2)),
          estimatedReach: platform === 'instagram' ? '1.4x vs post estatico' : platform === 'linkedin' ? '3x vs texto' : '1.8x vs video',
        },
        factors: {
          slideCount: total,
          hookType: hookSlide?.type || 'none',
          uniqueSlideTypes: uniqueTypes,
          slidesWithData,
          hasCTA: ctaSlide?.type === 'cta',
          hasCaption: !!carousel.caption,
        },
        tips,
        benchmark: `Promedio ${platform}: ${baseRates[platform]}% engagement`,
      }
    }

    // ── Batch Edit ──
    case 'batch_edit_slides': {
      const { carouselId, instruction } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }

      // Return current slide contents for Claude to process
      const currentSlides = carousel.slides.map((s, i) => ({
        index: i,
        type: s.type,
        fields: s.fields,
      }))

      return {
        carouselId: carousel.id,
        instruction,
        slideCount: carousel.slides.length,
        currentSlides,
        note: 'Aplica la instruccion a cada slide y usa edit_slide para cada cambio. Respeta el tipo de slide y no cambies campos que no correspondan a la instruccion.',
      }
    }

    // ── Platform Optimization ──
    case 'optimize_for_platform': {
      const { carouselId, platform } = args
      const carousel = getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }

      const slides = carousel.slides
      const total = slides.length
      const hookSlide = slides[0]
      const ctaSlide = slides[total - 1]

      const recommendations: string[] = []
      const ctaSuggestions: string[] = []

      if (platform === 'instagram') {
        if (total < 7) recommendations.push(`Aumentar a 8-10 slides (tienes ${total}). Mas slides = mas dwell time`)
        recommendations.push('Hook: usar numero impactante o pregunta provocadora')
        recommendations.push('Cada slide debe poder funcionar como screenshot individual (shareable)')
        recommendations.push('Incluir al menos 2 slides con datos/numeros concretos para impulsar saves')
        ctaSuggestions.push('ENVIA ESTO A ALGUIEN (senal #1 del algoritmo)')
        ctaSuggestions.push('GUARDA PARA DESPUES')
        ctaSuggestions.push('COMENTA [emoji] SI TE IDENTIFICAS')
        if (!carousel.caption) recommendations.push('URGENTE: generar caption con CTA a guardar + hashtags')
      } else if (platform === 'linkedin') {
        if (total > 8) recommendations.push('Reducir a 5-8 slides. LinkedIn prefiere contenido denso y conciso')
        recommendations.push('Tono educativo y profesional. Evitar emojis y slang')
        recommendations.push('Primer slide: insight unico o dato controversial (genera clicks)')
        recommendations.push('Incluir datos de industria, benchmarks, o resultados reales')
        recommendations.push('Ultimo slide: pregunta abierta que genere comentarios')
        ctaSuggestions.push('¿Estas de acuerdo? Comenta tu experiencia')
        ctaSuggestions.push('Comparte si conoces a alguien que necesite esto')
        ctaSuggestions.push('Descarga la guia completa (link en comentario)')
        recommendations.push('NOTA: LinkedIn usa carousels como PDF. Exportar en formato 1200x1200')
      } else if (platform === 'tiktok') {
        if (total > 7) recommendations.push('Maximo 7 slides en TikTok. Atencion es mas corta')
        recommendations.push('Hook visual: usar colores fuertes y texto grande')
        recommendations.push('Ritmo rapido: 1 idea por slide, sin texto largo')
        recommendations.push('Agregar musica trending al publicar (pushes al feed de Reels)')
        recommendations.push('Formato 1080x1920 (9:16)')
        ctaSuggestions.push('Sigueme para mas tips como este')
        ctaSuggestions.push('Guarda y comparte')
        ctaSuggestions.push('Duet con tu opinion')
      }

      return {
        carouselId: carousel.id,
        platform,
        currentSlideCount: total,
        optimalSlideCount: platform === 'instagram' ? '8-10' : platform === 'linkedin' ? '5-8' : '5-7',
        exportFormat: platform === 'instagram' ? '1080x1350' : platform === 'linkedin' ? '1200x1200' : '1080x1920',
        recommendations,
        ctaSuggestions,
        hookAnalysis: {
          currentHook: hookSlide?.fields?.title || 'Sin hook',
          platform_tip: platform === 'instagram'
            ? 'Hooks con numeros o preguntas generan 18% mas engagement en IG'
            : platform === 'linkedin'
              ? 'Hooks con insights unicos o datos contrarios generan mas clicks en LinkedIn'
              : 'Hooks cortos y visuales. Maximo 6 palabras en TikTok',
        },
      }
    }

    // ── Generate Outline ──
    case 'generate_outline': {
      const { topic, slideCount = 7, framework = 'auto', platform = 'instagram' } = args

      // Return a structured prompt for Claude to fill
      return {
        topic,
        targetSlides: slideCount,
        framework,
        platform,
        platformTip: platform === 'instagram'
          ? '8-10 slides, emocional, saves-oriented, DM-send CTAs'
          : platform === 'linkedin'
            ? '5-8 slides, educativo, datos, profesional, PDF format'
            : '5-7 slides, rapido, trending, visual, 9:16',
        instruction: `Genera un outline de ${slideCount} slides para el tema "${topic}". Para cada slide incluye: numero, tipo de slide sugerido, titulo propuesto, puntos clave (2-3 bullets), y por que ese tipo de slide en esa posicion. El usuario va a revisar y puede pedir cambios antes de generar el carrusel visual. Framework: ${framework}. Plataforma: ${platform}.`,
        outlineFormat: {
          slides: Array.from({ length: slideCount }, (_, i) => ({
            number: i + 1,
            suggestedType: i === 0 ? 'hook' : i === slideCount - 1 ? 'cta' : '[tipo]',
            title: '[titulo propuesto]',
            keyPoints: ['[punto 1]', '[punto 2]'],
            rationale: '[por que este tipo de slide aqui]',
          })),
        },
      }
    }

    case 'set_carousel_style': {
      const { carouselId, style } = args
      const carousel = carouselId === 'latest' ? getLatestCarousel() : getCarousel(carouselId)
      if (!carousel) return { error: 'Carousel not found' }
      // Apply style to all slides
      for (const slide of carousel.slides) {
        slide.fields.bgStyle = style
      }
      setCarousel(carousel)
      const brand = getBrand(carousel.brandId)
      const allPreviews = carousel.slides.map((s: any, i: number) =>
        renderSlideHTML(s, i, carousel.slides.length, brand)
      )
      return {
        applied: true,
        style,
        slideCount: carousel.slides.length,
        allPreviews,
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
