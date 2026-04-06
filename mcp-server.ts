#!/usr/bin/env npx tsx
/**
 * Carousel Agent MCP Server
 *
 * Exposes carousel creation tools via the Model Context Protocol (MCP).
 * External agents (like HeyMark's Mastra agent) can connect to this server
 * and call tools programmatically to generate Instagram carousels.
 *
 * Usage:
 *   npx tsx mcp-server.ts
 *
 * Or add to your MCP config:
 *   {
 *     "mcpServers": {
 *       "carousel-agent": {
 *         "command": "npx",
 *         "args": ["tsx", "/path/to/carousel-agent/mcp-server.ts"]
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// @ts-ignore
import { renderSlideHTML } from './shared/renderers.js'
// @ts-ignore
import { DEFAULT_BRANDS, deriveColors, makeBrand } from './shared/brands.js'

// ── In-memory stores ──
const carouselStore = new Map<string, any>()
let _carId = 0
let _slideId = 0

function generateCarouselId() { return `car_${++_carId}_${Date.now()}` }
function generateSlideId() { return `s_${++_slideId}` }

function getBrand(brandId: string, customBrand?: any) {
  if (brandId === 'custom' && customBrand) return customBrand
  return DEFAULT_BRANDS.find((b: any) => b.id === brandId) || DEFAULT_BRANDS[0]
}

// ── Create MCP Server ──
const server = new McpServer({
  name: 'carousel-agent',
  version: '1.0.0',
})

// ── Tool: create_carousel ──
server.tool(
  'create_carousel',
  'Creates a complete Instagram carousel with multiple slides. Returns HTML previews for each slide.',
  {
    name: z.string().describe('Name/topic of the carousel'),
    brandId: z.string().describe('Brand ID: cristiannieto, futbolin, heymark, or custom'),
    slides: z.array(z.object({
      type: z.enum(['hook', 'content', 'bigNumber', 'list', 'beforeAfter', 'cta']),
      fields: z.record(z.string(), z.any()).describe('Slide fields matching the type'),
    })).describe('Array of slides. First should be hook, last should be cta.'),
    customBrand: z.object({
      name: z.string(),
      handle: z.string(),
      accentColor: z.string(),
      mode: z.enum(['dark', 'light']),
      titleFont: z.string().optional(),
      bodyFont: z.string().optional(),
    }).optional().describe('Custom brand config. Required when brandId="custom".'),
  },
  async ({ name, brandId, slides, customBrand: customBrandInput }) => {
    let brand: any
    if (brandId === 'custom' && customBrandInput) {
      const colors = deriveColors(customBrandInput.accentColor, customBrandInput.mode)
      brand = makeBrand({
        id: 'custom',
        name: customBrandInput.name,
        handle: customBrandInput.handle,
        ...colors,
        titleFont: customBrandInput.titleFont || 'Inter',
        titleWeight: '700',
        bodyFont: customBrandInput.bodyFont || 'Inter',
        monoFont: 'JetBrains Mono',
        mode: customBrandInput.mode,
      })
    } else {
      brand = getBrand(brandId)
    }

    const carousel = {
      id: generateCarouselId(),
      name,
      brandId,
      slides: slides.map(s => ({ id: generateSlideId(), type: s.type, fields: s.fields })),
      createdAt: Date.now(),
    }
    carouselStore.set(carousel.id, carousel)

    const previews = carousel.slides.map((s: any, i: number) =>
      renderSlideHTML(s, i, carousel.slides.length, brand)
    )

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          carouselId: carousel.id,
          carouselName: name,
          slideCount: carousel.slides.length,
          brandName: brand.name,
          slideSummary: carousel.slides.map((s: any, i: number) =>
            `Slide ${i + 1}: [${s.type}] ${s.fields.title || s.fields.number || s.fields.badge || ''}`
          ),
          htmlPreviews: previews,
        }),
      }],
    }
  },
)

// ── Tool: generate_caption ──
server.tool(
  'generate_caption',
  'Saves Instagram caption with hashtags for a carousel.',
  {
    carouselId: z.string(),
    caption: z.string().describe('Full Instagram caption text'),
    hashtags: z.array(z.string()).describe('Hashtags without # prefix'),
  },
  async ({ carouselId, caption, hashtags }) => {
    const carousel = carouselStore.get(carouselId)
    if (!carousel) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Carousel not found' }) }] }
    }
    carousel.caption = { text: caption, hashtags }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ saved: true, caption, hashtags }) }],
    }
  },
)

// ── Tool: edit_slide ──
server.tool(
  'edit_slide',
  'Edits fields of a specific slide in a carousel.',
  {
    carouselId: z.string(),
    slideIndex: z.number().describe('0-based index of the slide to edit'),
    updates: z.record(z.string(), z.any()).describe('Fields to update'),
  },
  async ({ carouselId, slideIndex, updates }) => {
    const carousel = carouselStore.get(carouselId)
    if (!carousel) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Carousel not found' }) }] }
    }
    carousel.slides[slideIndex].fields = { ...carousel.slides[slideIndex].fields, ...updates }
    const brand = getBrand(carousel.brandId)
    const preview = renderSlideHTML(carousel.slides[slideIndex], slideIndex, carousel.slides.length, brand)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ updated: true, slideIndex, htmlPreview: preview }) }],
    }
  },
)

// ── Tool: get_carousel_preview ──
server.tool(
  'get_carousel_preview',
  'Gets full HTML preview of all slides in a carousel.',
  {
    carouselId: z.string().describe('Carousel ID, or "latest" for the most recent'),
  },
  async ({ carouselId }) => {
    let carousel: any
    if (carouselId === 'latest') {
      const entries = Array.from(carouselStore.values())
      carousel = entries[entries.length - 1]
    } else {
      carousel = carouselStore.get(carouselId)
    }
    if (!carousel) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Carousel not found' }) }] }
    }
    const brand = getBrand(carousel.brandId)
    const previews = carousel.slides.map((s: any, i: number) =>
      renderSlideHTML(s, i, carousel.slides.length, brand)
    )
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          carouselId: carousel.id,
          name: carousel.name,
          slideCount: carousel.slides.length,
          htmlPreviews: previews,
          caption: carousel.caption || null,
        }),
      }],
    }
  },
)

// ── Tool: extract_brand_from_url ──
server.tool(
  'extract_brand_from_url',
  'Scrapes a website URL to extract brand colors, fonts, and metadata for carousel generation.',
  {
    url: z.string().describe('Website URL to analyze'),
  },
  async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarouselAgent/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await response.text()

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ''

      const colorMatches = new Set<string>()
      const hexPattern = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
      let match
      while ((match = hexPattern.exec(html)) !== null) {
        const hex = match[0].toUpperCase()
        if (!['#FFFFFF', '#FFF', '#000000', '#000', '#333333', '#333', '#666666', '#999', '#CCC', '#EEE'].includes(hex)) {
          colorMatches.add(hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex)
        }
      }

      const fontFamilies = new Set<string>()
      const fontPattern = /font-family:\s*['"]?([^'";,}]+)/gi
      while ((match = fontPattern.exec(html)) !== null) {
        const font = match[1].trim()
        if (!['inherit', 'system-ui', '-apple-system', 'sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica'].includes(font)) {
          fontFamilies.add(font)
        }
      }

      const colors = Array.from(colorMatches).slice(0, 6)
      const fonts = Array.from(fontFamilies).slice(0, 4)

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            url,
            title,
            colors,
            suggestedAccent: colors[0] || '#000000',
            fonts,
            suggestedTitleFont: fonts[0] || 'Inter',
            suggestedBodyFont: fonts[1] || fonts[0] || 'Inter',
            brandKit: {
              name: title.split(/[|\-–]/).map((s: string) => s.trim())[0] || new URL(url).hostname,
              handle: new URL(url).hostname.replace('www.', '').split('.')[0],
              accentColor: colors[0] || '#000000',
              titleFont: fonts[0] || 'Inter',
              bodyFont: fonts[1] || fonts[0] || 'Inter',
            },
          }),
        }],
      }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }] }
    }
  },
)

// ── Tool: list_brands ──
server.tool(
  'list_brands',
  'Lists all available preset brands with their colors and settings.',
  {},
  async () => {
    const brands = DEFAULT_BRANDS.map((b: any) => ({
      id: b.id,
      name: b.name,
      handle: b.handle,
      accent: b.accent,
      mode: b.mode,
    }))
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ brands }) }],
    }
  },
)

// ── Start server ──
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[MCP] Carousel Agent MCP Server running on stdio')
}

main().catch(err => {
  console.error('[MCP] Fatal error:', err)
  process.exit(1)
})
