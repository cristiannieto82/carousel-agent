import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Carousel Agent',
  description: 'AI-powered Instagram carousel generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
