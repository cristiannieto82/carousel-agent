import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050505',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://carousel-agent.vercel.app'),
  title: 'Carousel Agent — AI-Powered Carousel Creator',
  description: 'Crea carruseles premium para Instagram y LinkedIn con IA. Genera contenido, diseño y copy en segundos con inteligencia artificial.',
  keywords: ['carousel', 'instagram', 'linkedin', 'AI', 'content creator', 'social media'],
  authors: [{ name: 'Cristian Nieto', url: 'https://cristiannieto.dev' }],
  openGraph: {
    title: 'Carousel Agent — AI-Powered Carousel Creator',
    description: 'Crea carruseles premium para Instagram y LinkedIn con IA.',
    type: 'website',
    locale: 'es_CL',
    siteName: 'Carousel Agent',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carousel Agent',
    description: 'Crea carruseles premium con IA',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body>{children}</body>
    </html>
  )
}
