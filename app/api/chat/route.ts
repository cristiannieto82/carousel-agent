import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { executeToolCall, anthropicToolDefs, registerCustomBrand } from '@/lib/tools'
import { routeModel } from '@/lib/model-router'
import { filterTools } from '@/lib/tool-filter'
import { compressHistory } from '@/lib/context-compressor'
import { calculateStepCost, aggregateMetrics, type StepMetrics } from '@/lib/cost-tracker'

export const maxDuration = 120

const client = new Anthropic()

// Server-side conversation store (per session)
const sessions = new Map<string, any[]>()

function getSession(id: string): any[] {
  if (!sessions.has(id)) sessions.set(id, [])
  return sessions.get(id)!
}

export interface AgentStep {
  type: 'classify' | 'model' | 'tools' | 'cache' | 'compress' | 'tool_call' | 'done'
  label: string
  detail?: string
}

export async function POST(req: Request) {
  try {
    const { message, sessionId = 'default', brandKit } = await req.json()
    const history = getSession(sessionId)
    const agentSteps: AgentStep[] = []
    const stepMetrics: StepMetrics[] = []

    // Register custom brand if provided
    if (brandKit) {
      registerCustomBrand(brandKit)
    }

    // Build system prompt with brand context
    const systemPrompt = brandKit
      ? buildSystemPrompt({
          name: brandKit.name,
          handle: brandKit.handle,
          description: brandKit.description || '',
          accentColor: brandKit.accentColor,
          mode: brandKit.mode,
          titleFont: brandKit.titleFont,
          bodyFont: brandKit.bodyFont,
          tone: brandKit.tone,
          cta: brandKit.cta,
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

    // ── Step 3: Context compression ──
    history.push({ role: 'user', content: message })
    const { compressed: compressedHistory, wasCompressed } = await compressHistory(history, client)
    if (wasCompressed) {
      agentSteps.push({
        type: 'compress',
        label: 'Historial comprimido',
        detail: `${history.length} msgs → ${compressedHistory.length} msgs`,
      })
    }

    console.log(`[agent] Session: ${sessionId} | Model: ${route.model} | Tools: ${sent}/${total} | User: ${message.slice(0, 80)}`)

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
      console.log(`[agent] Step ${step + 1}, messages: ${compressedHistory.length}`)

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

      console.log(
        `[agent] Step ${step + 1}: tokens in=${usage?.input_tokens} out=${usage?.output_tokens} cache_read=${cacheRead} cache_write=${usage?.cache_creation_input_tokens || 0} cost=$${metrics.costUSD.toFixed(4)}`,
      )

      // Add assistant response to conversation history
      const assistantContent = response.content
      history.push({ role: 'assistant', content: assistantContent })
      compressedHistory.push({ role: 'assistant', content: assistantContent })

      const textBlocks = response.content.filter((b) => b.type === 'text') as any[]
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use') as any[]

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0) {
        const finalText = textBlocks.map((b: any) => b.text).join('\n')
        agentSteps.push({ type: 'done', label: 'Respuesta generada' })
        const sessionMetrics = aggregateMetrics(stepMetrics)
        console.log(
          `[agent] Done. Cost: $${sessionMetrics.totalCostUSD.toFixed(4)} (sin optimizaciones: $${sessionMetrics.totalCostWithoutOptimizationsUSD.toFixed(4)}, ahorro: ${sessionMetrics.savingsPercent.toFixed(1)}%)`,
        )
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
        console.log(`[agent] Calling tool: ${toolUse.name}`)
        const result = await executeToolCall(toolUse.name, toolUse.input)
        allToolResults.push({ toolName: toolUse.name, result })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
      }

      // Add tool results to conversation history
      const toolResultMsg = { role: 'user', content: toolResults }
      history.push(toolResultMsg)
      compressedHistory.push(toolResultMsg)

      // If stop_reason is 'end_turn', break
      if (response.stop_reason === 'end_turn') {
        const finalText = textBlocks.map((b: any) => b.text).join('\n')
        agentSteps.push({ type: 'done', label: 'Respuesta generada' })
        const sessionMetrics = aggregateMetrics(stepMetrics)
        return Response.json({ text: finalText, toolResults: allToolResults, agentSteps, metrics: sessionMetrics })
      }
    }

    const sessionMetrics = aggregateMetrics(stepMetrics)
    return Response.json({
      text: 'Proceso completado.',
      toolResults: allToolResults,
      agentSteps,
      metrics: sessionMetrics,
    })
  } catch (err: any) {
    console.error('[agent] ERROR:', err.message)
    console.error('[agent] Full error:', JSON.stringify(err, null, 2).slice(0, 500))
    return Response.json({ error: err.message || 'Error desconocido' }, { status: 500 })
  }
}

// Clear session
export async function DELETE(req: Request) {
  const { sessionId = 'default' } = await req.json().catch(() => ({}))
  sessions.delete(sessionId)
  return Response.json({ cleared: true })
}
