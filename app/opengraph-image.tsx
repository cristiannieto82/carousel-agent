import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Carousel Agent — AI-Powered Carousel Creator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#050505',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '600px',
            background: 'radial-gradient(ellipse at center, rgba(255,72,0,0.15) 0%, rgba(255,72,0,0.05) 40%, transparent 70%)',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(rgba(42,42,42,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,42,0.3) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.4,
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '88px',
            height: '88px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #FF4800 0%, #FF5E1A 100%)',
            boxShadow: '0 8px 40px rgba(255,72,0,0.4), 0 0 80px rgba(255,72,0,0.15)',
            marginBottom: '32px',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#F5F5F5',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            Carousel
          </span>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#FF4800',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            Agent
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: '#A0A0A0',
            marginBottom: '40px',
            letterSpacing: '0.02em',
          }}
        >
          AI-Powered Carousel Creator
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          {['Brand Icons', '13 Slide Types', 'AI Scoring', 'Multi-Platform Export'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '100px',
                border: '1px solid rgba(255,72,0,0.3)',
                background: 'rgba(255,72,0,0.06)',
                fontSize: '15px',
                fontWeight: 600,
                color: '#FF4800',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#FF4800',
                  boxShadow: '0 0 8px rgba(255,72,0,0.8)',
                }}
              />
              {label}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            color: '#555555',
          }}
        >
          <span style={{ color: '#FF4800' }}>@</span>
          <span>cristiannieto.dev</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
