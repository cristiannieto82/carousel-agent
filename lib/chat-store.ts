export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults?: any[]
  agentSteps?: any[]
  metrics?: any
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  brandKitName: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'carousel_agent_conversations'
const ACTIVE_KEY = 'carousel_agent_active_conversation'
const MAX_CONVERSATIONS = 50

function readConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Conversation[]
  } catch {
    return []
  }
}

function writeConversations(conversations: Conversation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

export function getConversations(): Conversation[] {
  return readConversations().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getConversation(id: string): Conversation | null {
  return readConversations().find((c) => c.id === id) ?? null
}

export function createConversation(brandKitName: string): Conversation {
  const now = Date.now()
  const conversation: Conversation = {
    id: `conv_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title: 'New conversation',
    messages: [],
    brandKitName,
    createdAt: now,
    updatedAt: now,
  }

  const conversations = readConversations()
  conversations.push(conversation)

  // Enforce max limit — remove oldest by updatedAt
  if (conversations.length > MAX_CONVERSATIONS) {
    conversations.sort((a, b) => b.updatedAt - a.updatedAt)
    conversations.length = MAX_CONVERSATIONS
  }

  writeConversations(conversations)
  return conversation
}

export function updateConversation(id: string, messages: ChatMessage[]): void {
  const conversations = readConversations()
  const index = conversations.findIndex((c) => c.id === id)
  if (index === -1) return

  conversations[index].messages = messages
  conversations[index].updatedAt = Date.now()

  writeConversations(conversations)
}

export function updateConversationTitle(id: string, title: string): void {
  const conversations = readConversations()
  const index = conversations.findIndex((c) => c.id === id)
  if (index === -1) return

  conversations[index].title = title
  conversations[index].updatedAt = Date.now()

  writeConversations(conversations)
}

export function deleteConversation(id: string): void {
  const conversations = readConversations().filter((c) => c.id !== id)
  writeConversations(conversations)

  // Clear active ID if it was the deleted conversation
  if (getActiveConversationId() === id) {
    setActiveConversationId(null)
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? null
  } catch {
    return null
  }
}

export function setActiveConversationId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_KEY)
  } else {
    localStorage.setItem(ACTIVE_KEY, id)
  }
}

export function generateTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (!firstUserMessage) return 'New conversation'

  const content = firstUserMessage.content.trim().replace(/\n/g, ' ')
  if (content.length <= 50) return content
  return content.slice(0, 50) + '...'
}
