export interface HookFormula {
  id: string
  category: 'curiosity' | 'authority' | 'contrarian' | 'number' | 'story' | 'pain' | 'aspiration' | 'urgency'
  name: string
  template: string
  example: string
  bestFor: string
}

export const HOOK_FORMULAS: HookFormula[] = [
  // ── Curiosidad ──
  { id: 'h01', category: 'curiosity', name: 'El secreto que nadie cuenta', template: 'El secreto de [resultado] que nadie te va a contar', example: 'El secreto de facturar $10K/mes que nadie te va a contar', bestFor: 'Revelar conocimiento exclusivo' },
  { id: 'h02', category: 'curiosity', name: 'Lo que no sabes sobre', template: 'Lo que no sabes sobre [tema] te esta costando [consecuencia]', example: 'Lo que no sabes sobre SEO te esta costando clientes', bestFor: 'Mostrar puntos ciegos' },
  { id: 'h03', category: 'curiosity', name: 'La razon real', template: 'La razon real por la que [problema comun]', example: 'La razon real por la que tu contenido no genera ventas', bestFor: 'Desafiar suposiciones' },
  { id: 'h04', category: 'curiosity', name: 'Nadie habla de esto', template: 'Nadie habla de esto, pero [verdad incomoda]', example: 'Nadie habla de esto, pero el 90% de las agencias no sirven', bestFor: 'Posicionarse como transparente' },

  // ── Autoridad / Numeros ──
  { id: 'h05', category: 'number', name: 'Cifra impactante', template: '[numero impactante] en [periodo corto]', example: '$47,000 en 30 dias con una landing page', bestFor: 'Resultados concretos' },
  { id: 'h06', category: 'number', name: 'X cosas que', template: '[N] cosas que [audiencia] deberia [accion] en [año]', example: '5 cosas que todo founder deberia automatizar en 2026', bestFor: 'Listas accionables' },
  { id: 'h07', category: 'number', name: 'Porcentaje revelador', template: 'El [X]% de [grupo] no sabe que [dato revelador]', example: 'El 83% de las startups no sabe que estan pagando 4x de mas por marketing', bestFor: 'Estadisticas que sacuden' },
  { id: 'h08', category: 'authority', name: 'Resultado personal', template: 'Pase de [estado inicial] a [estado final] en [tiempo]', example: 'Pase de 0 a 10K seguidores en 60 dias sin pagar ads', bestFor: 'Social proof personal' },

  // ── Contrario / Provocador ──
  { id: 'h09', category: 'contrarian', name: 'Deja de hacer X', template: 'Deja de [accion comun]. Haz esto en su lugar.', example: 'Deja de publicar todos los dias. Haz esto en su lugar.', bestFor: 'Romper paradigmas' },
  { id: 'h10', category: 'contrarian', name: 'Impopular opinion', template: '[Consejo popular] es el peor consejo que te pueden dar', example: '"Se constante en redes" es el peor consejo que te pueden dar', bestFor: 'Generar debate' },
  { id: 'h11', category: 'contrarian', name: 'Lo estas haciendo mal', template: 'Estas [accion comun] mal. Y te esta costando [consecuencia]', example: 'Estas creando contenido mal. Y te esta costando miles de dolares', bestFor: 'Despertar urgencia' },
  { id: 'h12', category: 'contrarian', name: 'Mentira de la industria', template: 'La mentira mas grande de [industria]: [creencia popular]', example: 'La mentira mas grande del marketing: necesitas millones de seguidores', bestFor: 'Anti-establishment' },

  // ── Storytelling ──
  { id: 'h13', category: 'story', name: 'Casi me rindo', template: 'Estaba a punto de rendirme con [proyecto]. Entonces descubri [insight].', example: 'Estaba a punto de cerrar mi startup. Entonces descubri esto.', bestFor: 'Conexion emocional' },
  { id: 'h14', category: 'story', name: 'El dia que todo cambio', template: 'El dia que [evento inesperado] cambio mi forma de ver [tema]', example: 'El dia que un cliente me rechazo cambio mi forma de vender', bestFor: 'Narrativa de transformacion' },
  { id: 'h15', category: 'story', name: 'Hace X tiempo', template: 'Hace [tiempo] estaba [situacion mala]. Hoy [resultado positivo].', example: 'Hace 2 anos no tenia clientes. Hoy facturo $15K/mes.', bestFor: 'Before/after personal' },
  { id: 'h16', category: 'story', name: 'Error costoso', template: 'Cometi un error de [costo/consecuencia] por no saber [leccion]', example: 'Perdi $8,000 en ads por no saber esto', bestFor: 'Leccion de vulnerabilidad' },

  // ── Dolor / Problema ──
  { id: 'h17', category: 'pain', name: 'Si te pasa esto', template: 'Si [sintoma del problema], esto es para ti', example: 'Si publicas contenido y nadie interactua, esto es para ti', bestFor: 'Identificar audiencia' },
  { id: 'h18', category: 'pain', name: 'Cansado de', template: 'Cansado de [frustracion comun]? El problema no eres tu.', example: 'Cansado de pagar agencias que no generan resultados?', bestFor: 'Empatizar con frustracion' },
  { id: 'h19', category: 'pain', name: 'Tu competencia ya', template: 'Mientras tu [accion ineficiente], tu competencia ya [ventaja]', example: 'Mientras tu escribes captions a mano, tu competencia usa IA', bestFor: 'FOMO competitivo' },
  { id: 'h20', category: 'pain', name: 'Error comun', template: 'El error mas comun de [audiencia] que mata [metrica]', example: 'El error mas comun de founders que mata tu conversion', bestFor: 'Educacion de problema' },

  // ── Aspiracion ──
  { id: 'h21', category: 'aspiration', name: 'Imagina que', template: 'Imagina [resultado ideal] sin [sacrificio esperado]', example: 'Imagina generar 30 carruseles al mes sin escribir una linea', bestFor: 'Pintar el resultado ideal' },
  { id: 'h22', category: 'aspiration', name: 'La diferencia entre', template: 'La diferencia entre [grupo A] y [grupo exitoso B]', example: 'La diferencia entre marcas que venden y marcas que postean', bestFor: 'Posicionar aspiracion' },
  { id: 'h23', category: 'aspiration', name: 'Framework de exito', template: 'El framework de [N] pasos que uso para [resultado]', example: 'El framework de 3 pasos que uso para cerrar clientes con contenido', bestFor: 'Prometer sistema' },
  { id: 'h24', category: 'aspiration', name: 'Guia definitiva', template: 'La guia de [tema] que me habria ahorrado [tiempo/dinero]', example: 'La guia de pricing que me habria ahorrado 6 meses', bestFor: 'Valor concentrado' },

  // ── Urgencia ──
  { id: 'h25', category: 'urgency', name: 'Antes de que sea tarde', template: '[Accion] antes de que [consecuencia temporal]', example: 'Implementa esto antes de que tu competencia te copie', bestFor: 'Mover a accion rapida' },
  { id: 'h26', category: 'urgency', name: 'Tendencia que viene', template: 'En [periodo] todos van a [tendencia]. Empieza hoy.', example: 'En 6 meses todos van a usar agentes de IA. Empieza hoy.', bestFor: 'Early adopter FOMO' },
  { id: 'h27', category: 'urgency', name: 'Ventana de oportunidad', template: 'Hay una ventana de [tiempo] para [oportunidad]. Asi se aprovecha.', example: 'Hay una ventana de 12 meses para dominar tu nicho con IA', bestFor: 'Oportunidad temporal' },

  // ─�� Extras de alta conversion ──
  { id: 'h28', category: 'authority', name: 'Herramientas exactas', template: 'Las [N] herramientas exactas que uso para [resultado]', example: 'Las 5 herramientas que uso para crear contenido en 10 min', bestFor: 'Listas de recursos' },
  { id: 'h29', category: 'curiosity', name: 'Hack desconocido', template: 'El hack de [actividad] que el [X]% no conoce', example: 'El hack de Instagram que el 95% no conoce', bestFor: 'Exclusividad percibida' },
  { id: 'h30', category: 'pain', name: 'Dinero que pierdes', template: 'Estas perdiendo $[monto] al mes por [error solucionable]', example: 'Estas perdiendo $2,000/mes por no automatizar tu contenido', bestFor: 'Cuantificar dolor' },
]

export const HOOK_CATEGORIES = {
  curiosity: { name: 'Curiosidad', description: 'Genera intriga para que sigan leyendo' },
  authority: { name: 'Autoridad', description: 'Demuestra expertise y resultados' },
  contrarian: { name: 'Contrario', description: 'Desafia creencias populares' },
  number: { name: 'Numeros', description: 'Cifras impactantes que atrapan' },
  story: { name: 'Storytelling', description: 'Historias personales que conectan' },
  pain: { name: 'Dolor', description: 'Identifica problemas que resuenan' },
  aspiration: { name: 'Aspiracion', description: 'Pinta el resultado ideal' },
  urgency: { name: 'Urgencia', description: 'Crea sentido de accion inmediata' },
}

export function getHooksByCategory(category: string): HookFormula[] {
  return HOOK_FORMULAS.filter(h => h.category === category)
}

export function suggestHooks(topic: string, count: number = 5): HookFormula[] {
  const words = topic.toLowerCase().split(/\s+/)
  // Score each formula by keyword relevance
  const scored = HOOK_FORMULAS.map(h => {
    let score = 0
    const text = `${h.template} ${h.example} ${h.bestFor}`.toLowerCase()
    for (const w of words) {
      if (w.length > 3 && text.includes(w)) score += 2
    }
    // Add variety bonus — pick from different categories
    score += Math.random() * 0.5
    return { formula: h, score }
  })
  scored.sort((a, b) => b.score - a.score)
  // Ensure category diversity in top results
  const seen = new Set<string>()
  const result: HookFormula[] = []
  for (const { formula } of scored) {
    if (result.length >= count) break
    if (seen.size < count - 1 && seen.has(formula.category)) continue
    seen.add(formula.category)
    result.push(formula)
  }
  return result
}
