import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarouselAgent/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const name = titleMatch ? titleMatch[1].trim().split(/[|\-\u2013\u2014]/)[0].trim() : ''

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1].trim() : ''

    // Extract OG image
    const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    const ogImage = ogImgMatch ? ogImgMatch[1] : ''

    // Extract favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
    let favicon = faviconMatch ? faviconMatch[1] : ''
    if (favicon && !favicon.startsWith('http')) {
      const base = new URL(url)
      favicon = new URL(favicon, base.origin).href
    }

    // Extract colors
    const colorMatches = new Set<string>()
    const greylist = new Set([
      '#FFFFFF', '#FFF', '#000000', '#000', '#333333', '#333', '#666666', '#666',
      '#999', '#999999', '#CCC', '#CCCCCC', '#EEE', '#EEEEEE', '#F5F5F5', '#E5E5E5',
      '#111', '#111111', '#222', '#222222', '#444', '#444444', '#555', '#555555',
      '#777', '#777777', '#888', '#888888', '#AAA', '#AAAAAA', '#BBB', '#BBBBBB',
      '#DDD', '#DDDDDD',
    ])
    const hexPattern = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g
    let match
    while ((match = hexPattern.exec(html)) !== null) {
      const hex = match[0].toUpperCase()
      if (!greylist.has(hex)) {
        const normalized = hex.length === 4
          ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
          : hex
        colorMatches.add(normalized)
      }
    }

    // Also extract from CSS custom properties
    const cssVarPattern = /--(?:brand|primary|accent|main|color|theme)[^:]*:\s*([^;]+)/gi
    while ((match = cssVarPattern.exec(html)) !== null) {
      const val = match[1].trim()
      const hexInVar = val.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/)
      if (hexInVar) {
        colorMatches.add(hexInVar[0].toUpperCase())
      }
    }

    return NextResponse.json({
      name,
      description,
      colors: Array.from(colorMatches).slice(0, 12),
      logoUrl: favicon || ogImage,
      ogImage,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to extract' }, { status: 500 })
  }
}
