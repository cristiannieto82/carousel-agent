import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { executeToolCall, anthropicToolDefs, registerCustomBrand } from '@/lib/tools'
import { routeModel } from '@/lib/model-router'
import { filterTools } from '@/lib/tool-filter'
import { calculateStepCost, aggregateMetrics, type StepMetrics } from '@/lib/cost-tracker'

export const maxDuration = 120

const client = new Anthropic()

/**
 * Sanitize history so every assistant tool_use has a matching tool_result immediately after.
 * Removes orphaned assistant messages with tool_use blocks that lack tool_results.
 */
function sanitizeHistory(messages: any[]): any[] {
  const result: any[] = []
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    // Check if this assistant message contains tool_use blocks
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      const toolUseIds = msg.content
        .filter((b: any) => b.type === 'tool_use')
        .map((b: any) => b.id)

      if (toolUseIds.length > 0) {
        // Check if the next message has matching tool_results
        const next = messages[i + 1]
        const hasResults = next?.role === 'user' && Array.isArray(next?.content) &&
          toolUseIds.every((id: string) =>
            next.content.some((b: any) => b.type === 'tool_result' && b.tool_use_id === id)
          )

        if (!hasResults) {
          // Strip tool_use blocks, keep only text
          const textOnly = msg.content.filter((b: any) => b.type === 'text')
          if (textOnly.length > 0) {
            result.push({ role: 'assistant', content: textOnly })
          }
          continue
        }
      }
    }

    result.push(msg)
  }
  return result
}

export interface AgentStep {
  type: 'classify' | 'model' | 'tools' | 'cache' | 'compress' | 'tool_call' | 'done'
  label: string
  detail?: string
}

// Sanitize brand kit fields to prevent prompt injection
function sanitizeBrandField(value: string, maxLength = 100): string {
  if (!value || typeof value !== 'string') return ''
  // Strip newlines, control chars, and instruction-like patterns
  return value
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength)
    .trim()
}

export async function POST(req: Request) {
  try {
    const { message, history: clientHistory, brandKit, images } = await req.json()
    const agentSteps: AgentStep[] = []
    const stepMetrics: StepMetrics[] = []

    // Register custom brand if provided (with sanitized fields)
    if (brandKit) {
      registerCustomBrand({
        ...brandKit,
        name: sanitizeBrandField(brandKit.name, 50),
        handle: sanitizeBrandField(brandKit.handle, 50),
      })
      // Register brand logo as a globally available image for slides
      if (brandKit.logoDataUrl) {
        ;(globalThis as any).__carouselImages = {
          ...(globalThis as any).__carouselImages,
          brand_logo: brandKit.logoDataUrl,
        }
      }
    }

    // Build system prompt with sanitized brand context
    const systemPrompt = brandKit
      ? buildSystemPrompt({
          name: sanitizeBrandField(brandKit.name, 50),
          handle: sanitizeBrandField(brandKit.handle, 50),
          description: sanitizeBrandField(brandKit.description || '', 200),
          accentColor: sanitizeBrandField(brandKit.accentColor, 7),
          mode: brandKit.mode === 'light' ? 'light' : 'dark',
          titleFont: sanitizeBrandField(brandKit.titleFont, 40),
          bodyFont: sanitizeBrandField(brandKit.bodyFont, 40),
          tone: sanitizeBrandField(brandKit.tone, 30),
          cta: sanitizeBrandField(brandKit.cta, 100),
          hasLogo: !!brandKit.logoDataUrl,
        })
      : buildSystemPrompt()

    // ── Step 1: Tool filtering ──
    const { filtered: filteredToolDefs, sent, total } = filterTools(message, anthropicToolDefs)
    agentSteps.push({
      type: 'tools',
      label: `Filtrando tools: ${sent}/${total} enviadas`,
      detail: `${((1 - sent / total) * 100).toFixed(0)}% reduccion`,
    })

    // ── Step 2: Model routing ──
    const route = routeModel(message, filteredToolDefs.length)
    agentSteps.push({
      type: 'model',
      label: `Modelo: ${route.model.includes('haiku') ? 'Haiku' : 'Sonnet'}`,
      detail: route.reason,
    })

    // ── Step 3: Build messages from client history ──
    const messages: any[] = (clientHistory || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }))
    // Build user message — include image references if attached
    if (images && Array.isArray(images) && images.length > 0) {
      // Store full data URLs globally so tools can resolve them by ID
      const imageStore = images.reduce((acc: any, img: any) => { acc[img.id] = img.dataUrl; return acc }, {})
      ;(globalThis as any).__carouselImages = { ...(globalThis as any).__carouselImages, ...imageStore }

      const imageContext = images.map((img: any) =>
        `[Imagen adjunta: "${img.name}" (ID: ${img.id}). Para usar en un slide, agrega al campo images: [{ "src": "USE_IMAGE_${img.id}", "x": 440, "y": 100, "width": 200, "height": 200, "layer": "back" }]. Ajusta posicion y tamano segun lo que pida el usuario.]`
      ).join('\n')
      messages.push({ role: 'user', content: `${message}\n\n${imageContext}` })
    } else {
      messages.push({ role: 'user', content: message })
    }

    // Fix any corrupted history (orphaned tool_use without tool_result)
    const compressedHistory = sanitizeHistory(messages)

    // Model routing logged server-side only in dev
    if (process.env.NODE_ENV === 'development') console.log(`[agent] Model: ${route.model} | Tools: ${sent}/${total}`)

    const allToolResults: any[] = []

    // ── Step 4: Prompt caching setup ──
    // cache_control goes on the last system block and last tool definition
    const systemWithCache = [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ]

    const toolsWithCache = filteredToolDefs.map((t, i) =>
      i === filteredToolDefs.length - 1
        ? { ...t, cache_control: { type: 'ephemeral' as const } }
        : t,
    )

    agentSteps.push({ type: 'cache', label: 'Prompt caching activado' })

    // ── Agentic loop ──
    for (let step = 0; step < 10; step++) {
      if (process.env.NODE_ENV === 'development') console.log(`[agent] Step ${step + 1}, messages: ${compressedHistory.length}`)

      const response = await client.messages.create({
        model: route.model,
        max_tokens: 4096,
        system: systemWithCache,
        messages: compressedHistory,
        tools: toolsWithCache,
      } as any)

      // ── Cost tracking ──
      const usage = response.usage as any
      const metrics = calculateStepCost(
        route.model,
        {
          input_tokens: usage?.input_tokens,
          output_tokens: usage?.output_tokens,
          cache_read_input_tokens: usage?.cache_read_input_tokens,
          cache_creation_input_tokens: usage?.cache_creation_input_tokens,
        },
        sent,
        total,
        route.reason,
      )
      stepMetrics.push(metrics)

      const cacheRead = usage?.cache_read_input_tokens || 0
      if (cacheRead > 0) {
        agentSteps.push({
          type: 'cache',
          label: `Cache hit: ${cacheRead.toLocaleString()} tokens leidos del cache`,
        })
      }

      if (process.env.NODE_ENV === 'development') console.log(`[agent] Step ${step + 1}: in=${usage?.input_tokens} out=${usage?.output_tokens} cost=$${metrics.costUSD.toFixed(4)}`)

      // Add assistant response to conversation history
      const assistantContent = response.content
      compressedHistory.push({ role: 'assistant', content: assistantContent })

      const textBlocks = response.content.filter((b) => b.type === 'text') as any[]
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use') as any[]

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0) {
        // Strip markdown formatting (asterisks, bold, headers) from response
        const finalText = textBlocks.map((b: any) => b.text).join('\n')
          .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
          .replace(/\*([^*]+)\*/g, '$1')       // *italic* → italic
          .replace(/^#{1,6}\s+/gm, '')         // ### headers → text
          .replace(/^[-•]\s+/gm, '- ')         // normalize bullets
        agentSteps.push({ type: 'done', label: 'Respuesta generada' })
        const sessionMetrics = aggregateMetrics(stepMetrics)
        if (process.env.NODE_ENV === 'development') console.log(`[agent] Done. Cost: $${sessionMetrics.totalCostUSD.toFixed(4)}`)
        return Response.json({ text: finalText, toolResults: allToolResults, agentSteps, metrics: sessionMetrics })
      }

      // Execute each tool call
      const toolResults: any[] = []
      for (const toolUse of toolUseBlocks) {
        agentSteps.push({
          type: 'tool_call',
          label: `Tool: ${toolUse.name}`,
          detail: JSON.stringify(toolUse.input).slice(0, 100),
        })
        if (process.env.NODE_ENV === 'development') console.log(`[agent] Tool: ${toolUse.name}`)
        const result = await executeToolCall(toolUse.name, toolUse.input)
        allToolResults.push({ toolName: toolUse.name, result })

        // Strip heavy fields (allPreviews, previews contain full HTML with base64 images)
        // from the tool_result that goes into conversation history.
        // The model only needs IDs, summaries, and scores to continue the agentic loop.
        const { allPreviews, previews, preview, ...lightResult } = result || {}
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(lightResult),
        })
      }

      // Add tool results to conversation history
      const toolResultMsg = { role: 'user', content: toolResults }
      compressedHistory.push(toolResultMsg)

      // Always continue the loop so the model processes tool results.
      // Never break early when there are pending tool_results — the API
      // requires tool_result immediately after tool_use in the history.
    }

    const sessionMetrics = aggregateMetrics(stepMetrics)
    return Response.json({
      text: 'Proceso completado.',
      toolResults: allToolResults,
      agentSteps,
      metrics: sessionMetrics,
    })
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') console.error('[agent] ERROR:', err.message)
    return Response.json({ error: err.message || 'Error desconocido' }, { status: 500 })
  }
}