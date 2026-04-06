// Pricing per 1M tokens (USD) — April 2026
const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.0, cacheRead: 0.08, cacheWrite: 1.0 },
}

export interface StepMetrics {
  model: string
  modelReason: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  toolsSent: number
  totalTools: number
  costUSD: number
  costWithoutOptimizationsUSD: number
}

export interface SessionMetrics {
  steps: StepMetrics[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalCostUSD: number
  totalCostWithoutOptimizationsUSD: number
  savingsPercent: number
}

export function calculateStepCost(
  model: string,
  usage: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number },
  toolsSent: number,
  totalTools: number,
  modelReason: string,
): StepMetrics {
  const pricing = PRICING[model] || PRICING['claude-sonnet-4-20250514']

  const inputTokens = usage.input_tokens || 0
  const outputTokens = usage.output_tokens || 0
  const cacheReadTokens = usage.cache_read_input_tokens || 0
  const cacheCreationTokens = usage.cache_creation_input_tokens || 0

  // Actual cost with optimizations
  const costUSD =
    (inputTokens * pricing.input +
      outputTokens * pricing.output +
      cacheReadTokens * pricing.cacheRead +
      cacheCreationTokens * pricing.cacheWrite) / 1_000_000

  // What it would have cost: all cached tokens at full input price, using Sonnet always
  const sonnetPricing = PRICING['claude-sonnet-4-20250514']
  const totalInputIfNoCaching = inputTokens + cacheReadTokens + cacheCreationTokens
  const costWithoutOptimizationsUSD =
    (totalInputIfNoCaching * sonnetPricing.input +
      outputTokens * sonnetPricing.output) / 1_000_000

  return {
    model,
    modelReason,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
    toolsSent,
    totalTools,
    costUSD,
    costWithoutOptimizationsUSD,
  }
}

export function aggregateMetrics(steps: StepMetrics[]): SessionMetrics {
  const totals = steps.reduce(
    (acc, s) => ({
      totalInputTokens: acc.totalInputTokens + s.inputTokens,
      totalOutputTokens: acc.totalOutputTokens + s.outputTokens,
      totalCacheReadTokens: acc.totalCacheReadTokens + s.cacheReadTokens,
      totalCacheCreationTokens: acc.totalCacheCreationTokens + s.cacheCreationTokens,
      totalCostUSD: acc.totalCostUSD + s.costUSD,
      totalCostWithoutOptimizationsUSD: acc.totalCostWithoutOptimizationsUSD + s.costWithoutOptimizationsUSD,
    }),
    {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheCreationTokens: 0,
      totalCostUSD: 0,
      totalCostWithoutOptimizationsUSD: 0,
    },
  )

  const savingsPercent =
    totals.totalCostWithoutOptimizationsUSD > 0
      ? ((1 - totals.totalCostUSD / totals.totalCostWithoutOptimizationsUSD) * 100)
      : 0

  return { steps, ...totals, savingsPercent }
}
