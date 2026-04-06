'use client'

interface AgentStep {
  type: 'classify' | 'model' | 'tools' | 'cache' | 'compress' | 'tool_call' | 'done'
  label: string
  detail?: string
}

const STEP_STYLES: Record<string, { icon: string; color: string }> = {
  classify: { icon: '>', color: 'var(--text-secondary)' },
  model: { icon: '#', color: '#A78BFA' },
  tools: { icon: '~', color: '#F59E0B' },
  cache: { icon: '$', color: '#22C55E' },
  compress: { icon: '<', color: '#06B6D4' },
  tool_call: { icon: '!', color: 'var(--accent)' },
  done: { icon: '*', color: '#22C55E' },
}

export function AgentReplay({ steps }: { steps: AgentStep[] }) {
  if (!steps || steps.length === 0) return null

  return (
    <div
      className="animate-fade-in"
      style={{
        margin: '8px 0 12px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        lineHeight: 1.8,
      }}
    >
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        Agent Trace
      </div>
      {steps.map((step, i) => {
        const style = STEP_STYLES[step.type] || STEP_STYLES.classify
        return (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ color: style.color, fontWeight: 700, width: 12, textAlign: 'center', flexShrink: 0 }}>
              {style.icon}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {step.label}
              {step.detail && (
                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                  ({step.detail})
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
