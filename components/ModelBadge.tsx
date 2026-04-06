'use client'

export function ModelBadge({ model, reason }: { model: string; reason: string }) {
  const isHaiku = model.includes('haiku')
  const label = isHaiku ? 'Haiku' : 'Sonnet'
  const color = isHaiku ? '#22C55E' : '#A78BFA'

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '2px 8px', borderRadius: 'var(--radius-full)',
        background: `${color}12`,
        border: `1px solid ${color}30`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 600, color,
      }}
      title={reason}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {label}
    </span>
  )
}
