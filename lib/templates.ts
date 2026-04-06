export interface CarouselTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  framework: 'AIDA' | 'PAS' | 'BAB' | 'Story'
  slideStructure: { type: string; purpose: string }[]
  examplePrompt: (brand: string) => string
}

export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  {
    id: 'tips',
    name: '3-5 Tips',
    description: 'Lista de consejos accionables',
    icon: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    color: '#22C55E',
    framework: 'AIDA',
    slideStructure: [
      { type: 'hook', purpose: 'Numero + promesa: "5 tips para [resultado]"' },
      { type: 'content', purpose: 'Tip 1 con ejemplo concreto' },
      { type: 'content', purpose: 'Tip 2 con ejemplo concreto' },
      { type: 'content', purpose: 'Tip 3 con ejemplo concreto' },
      { type: 'bigNumber', purpose: 'Dato de impacto que refuerza el valor' },
      { type: 'cta', purpose: 'CTA directo' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 6 slides con 3 tips accionables para la audiencia de ${b}. Usa el template "3 Tips" con framework AIDA.`,
  },
  {
    id: 'before_after',
    name: 'Before / After',
    description: 'Transformacion con contraste',
    icon: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    color: '#3B82F6',
    framework: 'BAB',
    slideStructure: [
      { type: 'hook', purpose: 'Contraste impactante: "De [malo] a [bueno]"' },
      { type: 'beforeAfter', purpose: 'Comparacion visual Before vs After' },
      { type: 'content', purpose: 'El problema del "antes"' },
      { type: 'content', purpose: 'El puente: que cambio' },
      { type: 'bigNumber', purpose: 'Resultado concreto del "despues"' },
      { type: 'cta', purpose: 'CTA: como lograr la transformacion' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 6 slides tipo Before/After para ${b}. Muestra la transformacion de un cliente o proceso. Usa framework BAB.`,
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Historia personal que conecta',
    icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    color: '#A78BFA',
    framework: 'Story',
    slideStructure: [
      { type: 'hook', purpose: 'Gancho emocional: "Estaba a punto de..."' },
      { type: 'content', purpose: 'Contexto y situacion inicial' },
      { type: 'content', purpose: 'El conflicto o desafio' },
      { type: 'content', purpose: 'El punto de quiebre' },
      { type: 'bigNumber', purpose: 'El resultado transformador' },
      { type: 'list', purpose: 'Lecciones aprendidas' },
      { type: 'cta', purpose: 'CTA emocional' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 7 slides tipo storytelling para ${b}. Cuenta una historia real de transformacion con conflicto, quiebre y resultado. Framework Storytelling Arc.`,
  },
  {
    id: 'myth_reality',
    name: 'Mito vs Realidad',
    description: 'Rompe creencias falsas',
    icon: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    color: '#EF4444',
    framework: 'PAS',
    slideStructure: [
      { type: 'hook', purpose: 'Provocador: "Todo lo que te dijeron sobre [X] es mentira"' },
      { type: 'beforeAfter', purpose: 'Mito 1 vs Realidad' },
      { type: 'beforeAfter', purpose: 'Mito 2 vs Realidad' },
      { type: 'beforeAfter', purpose: 'Mito 3 vs Realidad' },
      { type: 'content', purpose: 'La verdad que nadie cuenta' },
      { type: 'cta', purpose: 'CTA provocador' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 6 slides "Mito vs Realidad" para ${b}. Desmiente 3 creencias populares falsas sobre el tema. Usa framework PAS y tono provocador.`,
  },
  {
    id: 'tools',
    name: 'Tool Roundup',
    description: 'Las mejores herramientas',
    icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    color: '#06B6D4',
    framework: 'AIDA',
    slideStructure: [
      { type: 'hook', purpose: 'Numero + valor: "5 herramientas que uso para [resultado]"' },
      { type: 'content', purpose: 'Herramienta 1 + para que sirve' },
      { type: 'content', purpose: 'Herramienta 2 + para que sirve' },
      { type: 'content', purpose: 'Herramienta 3 + para que sirve' },
      { type: 'list', purpose: 'Resumen de todas las herramientas' },
      { type: 'cta', purpose: 'CTA: guarda este post' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 6 slides con las mejores herramientas o recursos para la audiencia de ${b}. Template "Tool Roundup" con framework AIDA.`,
  },
  {
    id: 'step_by_step',
    name: 'Paso a Paso',
    description: 'Tutorial o proceso',
    icon: '<path d="M12 20v-6M6 20V10M18 20V4"/>',
    color: '#F59E0B',
    framework: 'AIDA',
    slideStructure: [
      { type: 'hook', purpose: 'Resultado + proceso: "Como [resultado] en [N] pasos"' },
      { type: 'content', purpose: 'Paso 1 con instruccion clara' },
      { type: 'content', purpose: 'Paso 2 con instruccion clara' },
      { type: 'content', purpose: 'Paso 3 con instruccion clara' },
      { type: 'bigNumber', purpose: 'Resultado esperado al seguir los pasos' },
      { type: 'cta', purpose: 'CTA: aplica hoy' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 6 slides tipo "Paso a Paso" para ${b}. Un tutorial claro de 3 pasos con resultado concreto. Framework AIDA.`,
  },
  {
    id: 'case_study',
    name: 'Caso de Estudio',
    description: 'Resultado real con datos',
    icon: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    color: '#EC4899',
    framework: 'BAB',
    slideStructure: [
      { type: 'hook', purpose: 'Resultado impactante: "[Cliente] logro [resultado] en [tiempo]"' },
      { type: 'content', purpose: 'Contexto: quien es y cual era su situacion' },
      { type: 'content', purpose: 'El desafio principal' },
      { type: 'content', purpose: 'La estrategia o solucion aplicada' },
      { type: 'bigNumber', purpose: 'Resultado en numeros' },
      { type: 'beforeAfter', purpose: 'Antes vs Despues con datos' },
      { type: 'cta', purpose: 'CTA: quieres resultados similares?' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 7 slides tipo "Caso de Estudio" para ${b}. Muestra un resultado real con datos, contexto y transformacion. Framework BAB.`,
  },
  {
    id: 'hot_take',
    name: 'Hot Take',
    description: 'Opinion contraria que genera debate',
    icon: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    color: '#FF4800',
    framework: 'PAS',
    slideStructure: [
      { type: 'hook', purpose: 'Opinion provocadora: "[Consejo popular] esta mal"' },
      { type: 'content', purpose: 'Por que la mayoria se equivoca' },
      { type: 'content', purpose: 'La evidencia contraria' },
      { type: 'bigNumber', purpose: 'Dato que respalda tu posicion' },
      { type: 'content', purpose: 'Lo que deberias hacer en su lugar' },
      { type: 'cta', purpose: 'CTA polarizante: estas de acuerdo?' },
    ],
    examplePrompt: (b) => `Crea un carrusel de 6 slides tipo "Hot Take" para ${b}. Una opinion contraria y provocadora que desafie una creencia popular. Framework PAS, tono confrontacional.`,
  },
]

export function getTemplate(id: string): CarouselTemplate | undefined {
  return CAROUSEL_TEMPLATES.find(t => t.id === id)
}
