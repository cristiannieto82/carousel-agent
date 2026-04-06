interface ToolCategory {
  keywords: string[]
  tools: string[]
}

const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  creation: {
    keywords: ['crea', 'genera', 'diseña', 'arma', 'haz', 'carrusel', 'post', 'contenido', 'storytelling'],
    tools: ['create_carousel', 'generate_caption'],
  },
  editing: {
    keywords: ['cambia', 'edita', 'modifica', 'ajusta', 'color', 'texto', 'fuente', 'titulo', 'agrega', 'slide'],
    tools: ['edit_slide', 'add_slide', 'remove_slide', 'get_carousel_preview'],
  },
  export: {
    keywords: ['exporta', 'descarga', 'png', 'imagen', 'guarda', 'preview', 'muestra'],
    tools: ['get_carousel_preview'],
  },
  caption: {
    keywords: ['caption', 'hashtag', 'descripcion', 'texto del post'],
    tools: ['generate_caption', 'get_carousel_preview'],
  },
  variants: {
    keywords: ['variante', 'a/b', 'ab test', 'alternativa', 'version', 'opcion', 'comparar'],
    tools: ['create_carousel', 'generate_variants', 'generate_caption'],
  },
  calendar: {
    keywords: ['calendario', 'semana', 'planifica', 'plan de contenido', 'semanal', 'lunes', 'agenda'],
    tools: ['generate_content_calendar', 'create_carousel', 'generate_caption'],
  },
  hooks: {
    keywords: ['hook', 'gancho', 'titulo', 'atractivo', 'atencion', 'frase', 'idea', 'sugiere', 'formula'],
    tools: ['suggest_hooks', 'create_carousel', 'generate_caption'],
  },
  reorder: {
    keywords: ['reorden', 'mover', 'posicion', 'intercambia', 'orden', 'reorganiza', 'drag'],
    tools: ['reorder_slides', 'get_carousel_preview'],
  },
  from_text: {
    keywords: ['articulo', 'texto', 'blog', 'convierte', 'transforma', 'extracto', 'resumen', 'post', 'transcript', 'pega', 'copie'],
    tools: ['carousel_from_text', 'create_carousel', 'generate_caption'],
  },
  scoring: {
    keywords: ['score', 'puntaje', 'analiza', 'evalua', 'califica', 'mejora', 'feedback', 'calidad', 'nota'],
    tools: ['score_carousel', 'get_carousel_preview'],
  },
  engagement: {
    keywords: ['engagement', 'prediccion', 'predice', 'rendimiento', 'alcance', 'reach', 'performance', 'metricas'],
    tools: ['predict_engagement', 'score_carousel', 'get_carousel_preview'],
  },
  batch: {
    keywords: ['todos los slides', 'batch', 'todos', 'masivo', 'conciso', 'acorta', 'general', 'global'],
    tools: ['batch_edit_slides', 'edit_slide', 'get_carousel_preview'],
  },
  platform: {
    keywords: ['instagram', 'linkedin', 'tiktok', 'plataforma', 'optimiza para', 'adapta para', 'red social'],
    tools: ['optimize_for_platform', 'predict_engagement', 'create_carousel'],
  },
  outline: {
    keywords: ['outline', 'estructura', 'esquema', 'planifica', 'borrador', 'antes de crear', 'primero muestrame'],
    tools: ['generate_outline', 'create_carousel', 'generate_caption'],
  },
  brand_extraction: {
    keywords: ['url', 'sitio', 'web', 'pagina', 'extraer', 'analizar marca', 'marca de', '.com', '.ai', '.io', 'https'],
    tools: ['extract_brand_from_url', 'create_carousel'],
  },
}

export function filterTools<T extends { name: string }>(userMessage: string, allTools: T[]): { filtered: T[]; sent: number; total: number } {
  const msg = userMessage.toLowerCase()
  const relevantToolNames = new Set<string>()

  for (const category of Object.values(TOOL_CATEGORIES)) {
    if (category.keywords.some(kw => msg.includes(kw))) {
      category.tools.forEach(t => relevantToolNames.add(t))
    }
  }

  // Fallback: send all tools if nothing matched
  if (relevantToolNames.size === 0) {
    return { filtered: allTools, sent: allTools.length, total: allTools.length }
  }

  const filtered = allTools.filter(t => relevantToolNames.has(t.name))

  // Safety: if we filtered to 0, send all
  if (filtered.length === 0) {
    return { filtered: allTools, sent: allTools.length, total: allTools.length }
  }

  return { filtered, sent: filtered.length, total: allTools.length }
}
