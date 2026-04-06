export interface RouteResult {
  model: string
  reason: string
}

export function routeModel(userMessage: string, toolsNeeded: number): RouteResult {
  const msg = userMessage.toLowerCase()

  // Simple tasks → Haiku (cheaper, faster)
  const simplePatterns = [
    /^(exporta|descarga|guarda)/,
    /cambiar? (color|fuente|texto|titulo)/,
    /dame el caption/,
    /quita|elimina|borra.*slide/,
    /muestra.*preview/,
  ]
  if (simplePatterns.some(p => p.test(msg)) || (toolsNeeded <= 1 && msg.length < 60)) {
    return { model: 'claude-haiku-4-5-20251001', reason: 'tarea simple' }
  }

  // Complex tasks → Sonnet
  const complexPatterns = [
    /estrategia/,
    /analiza/,
    /competencia/,
    /crea.*carrusel/,
    /genera.*contenido/,
    /calendario/,
    /variantes/,
    /remix/,
    /storytelling/,
  ]
  if (complexPatterns.some(p => p.test(msg)) || toolsNeeded >= 3) {
    return { model: 'claude-sonnet-4-20250514', reason: 'tarea compleja' }
  }

  // Default → Sonnet
  return { model: 'claude-sonnet-4-20250514', reason: 'default' }
}
