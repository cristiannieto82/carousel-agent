import Anthropic from '@anthropic-ai/sdk'

const RECENT_TURNS_TO_KEEP = 3

export async function compressHistory(
  messages: any[],
  client: Anthropic,
): Promise<{ compressed: any[]; wasCompressed: boolean }> {
  // Don't compress short conversations
  if (messages.length <= RECENT_TURNS_TO_KEEP * 2) {
    return { compressed: messages, wasCompressed: false }
  }

  // Find a safe split point that doesn't separate tool_use from tool_result.
  // Walk backwards from the ideal split to find a user message that isn't tool_results.
  let splitIdx = messages.length - RECENT_TURNS_TO_KEEP * 2
  while (splitIdx > 0) {
    const msg = messages[splitIdx]
    const isToolResult = msg.role === 'user' && Array.isArray(msg.content) &&
      msg.content.some((b: any) => b.type === 'tool_result')
    if (!isToolResult) break
    splitIdx--
  }
  if (splitIdx <= 0) {
    return { compressed: messages, wasCompressed: false }
  }

  const recentMessages = messages.slice(splitIdx)
  const olderMessages = messages.slice(0, splitIdx)

  // Summarize older messages with Haiku (cheap)
  const summaryContent = olderMessages
    .map(m => {
      const text = typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content)
          ? m.content.map((b: any) => b.type === 'text' ? b.text : `[${b.type}]`).join(' ')
          : JSON.stringify(m.content).slice(0, 200)
      return `${m.role}: ${text.slice(0, 300)}`
    })
    .join('\n')

  try {
    const summaryResponse = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: 'Resume esta conversacion en maximo 3 oraciones. Incluye: que carruseles se crearon, que estilo/marca se uso, y cualquier preferencia del usuario. Solo hechos, sin explicaciones.',
      messages: [{ role: 'user', content: summaryContent }],
    })

    const summary = summaryResponse.content[0].type === 'text'
      ? summaryResponse.content[0].text
      : ''

    return {
      compressed: [
        { role: 'user', content: `[Contexto previo: ${summary}]` },
        { role: 'assistant', content: 'Entendido, tengo el contexto.' },
        ...recentMessages,
      ],
      wasCompressed: true,
    }
  } catch {
    // If compression fails, just use recent messages
    return { compressed: messages, wasCompressed: false }
  }
}
