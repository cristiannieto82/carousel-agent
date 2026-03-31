'use client'

import { Chat } from '@/components/Chat'

export default function Home() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: 56, background: '#0C0C0C', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: '#F5F5F5' }}>carousel</span>
          <span style={{ color: '#FF4800' }}>.agent</span>
        </div>
        <div style={{ width: 1, height: 18, background: '#1E1E1E' }} />
        <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>AI-Powered Carousel Generator</span>
      </div>

      {/* Chat */}
      <Chat />
    </div>
  )
}
