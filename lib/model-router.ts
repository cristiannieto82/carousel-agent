export interface RouteResult {
  model: string
  reason: string
}

export function routeModel(_userMessage: string, _toolsNeeded: number): RouteResult {
  // Always use Sonnet — Haiku doesn't follow formatting instructions reliably
  return { model: 'claude-sonnet-4-20250514', reason: 'sonnet' }
}
