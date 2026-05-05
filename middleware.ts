import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiter (per-IP, resets on deploy)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30 // requests per window
const RATE_WINDOW = 60_000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets — skip
  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Rate limiting on API routes
  if (pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 },
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
