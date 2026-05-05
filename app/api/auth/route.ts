import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()
  const correctPassword = process.env.APP_PASSWORD
  if (!correctPassword) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })

  if (password === correctPassword) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('ca_auth', 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })
    return res
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
