import { generateId, getCarousel, setCarousel, getLatestCarousel } from './carousel-store'
// @ts-ignore
import { renderSlideHTML } from '../shared/renderers'
// @ts-ignore
import { DEFAULT_BRANDS } from '../shared/brands'
import type { Carousel, Brand } from './types'

function getBrand(brandId: string): Brand {
  return (DEFAULT_BRANDS.find((b: any) => b.id === brandId) || DEFAULT_BRANDS[0]) as Brand
}

let _slideId = 0
function slideId() { return `s_${++_slideId}` }

// ── Anthropic-native tool definitions ──
export const anthropicToolDefs = [
  {
    name: 'create_carousel',
    description: 'Creates a complete Instagram carousel with multiple slides. Use when the user asks to create a new carousel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name/topic of the carousel' },
        brandId: { type: 'string', description: 'Brand ID: cristiannieto, futbolin, or heymark' },
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
]

// ── Tool execution ──
export function executeToolCall(toolName: string, args: any): any {
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
    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
