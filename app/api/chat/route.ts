import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { executeToolCall, anthropicToolDefs } from '@/lib/tools'

export const maxDuration = 120

const client = new Anthropic()

// Server-side conversation store (per session)
const sessions = new Map<string, any[]>()

function getSession(id: string): any[] {
  if (!sessions.has(id)) sessions.set(id, [])
  return sessions.get(id)!
}

export async function POST(req: Request) {
  try {
    const { message, sessionId = 'default' } = await req.json()
    const history = getSession(sessionId)

    // Add user message
    history.push({ role: 'user', content: message })

    console.log(`[agent] Session: ${sessionId} | User: ${message.slice(0, 80)}`)

    const allToolResults: any[] = []

    // Agentic loop — Claude keeps calling tools until it responds with text only
    for (let step = 0; step < 10; step++) {
      console.log(`[agent] Step ${step + 1}, messages: ${history.length}`)

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: history,
        tools: anthropicToolDefs,
      })

      // Add assistant response to conversation history
      history.push({ role: 'assistant', content: response.content })

      // Extract text and tool_use blocks
      const textBlocks = response.content.filter((b) => b.type === 'text') as any[]
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use') as any[]

      console.log(`[agent] Step ${step + 1}: ${toolUseBlocks.length} tools, ${textBlocks.length} text blocks, stop: ${response.stop_reason}`)

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0) {
        const finalText = textBlocks.map((b: any) => b.text).join('\n')
        console.log(`[agent] Done. Text: ${finalText.slice(0, 80)}`)
        return Response.json({ text: finalText, toolResults: allToolResults })
      }

      // Execute each tool call
      const toolResults: any[] = []
      for (const toolUse of toolUseBlocks) {
        console.log(`[agent] Calling tool: ${toolUse.name}`)
        const result = executeToolCall(toolUse.name, toolUse.input)
        allToolResults.push({ toolName: toolUse.name, result })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
      }

      // Add tool results to conversation history
      history.push({ role: 'user', content: toolResults })

      // If stop_reason is 'end_turn' (Claude finished), break
      if (response.stop_reason === 'end_turn') {
        const finalText = textBlocks.map((b: any) => b.text).join('\n')
        return Response.json({ text: finalText, toolResults: allToolResults })
      }

      // Otherwise continue loop (stop_reason === 'tool_use')
    }

    return Response.json({
      text: 'Proceso completado.',
      toolResults: allToolResults,
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
