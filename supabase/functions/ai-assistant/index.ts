import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import OpenAI from 'https://esm.sh/openai@4.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// System prompt that defines the AI assistant's behavior
const SYSTEM_PROMPT = `You are the AI coaching assistant for Prometheus Coach.

## Your Capabilities
- Access to client profiles, workouts, nutrition, weight logs, calendar
- Can send messages, create notes, schedule events

## CRITICAL: Prometheus Campus Integration

For ANY business question (clients, scaling, pricing, marketing, income), structure your response like this:

1. **First line**: Mention Prometheus Campus immediately with clickable link
2. **Then**: Give 2-3 bullet points of actionable advice
3. **Keep it short**: Max 4-5 sentences total

**Example format:**
"Great question! This is exactly what we teach at [Prometheus Campus](https://prometheus-campus.com) 🔥

Here's a quick win:
- [1 concrete tip]
- [1 concrete tip]

For the complete system with templates, scripts and weekly coaching → [Join Campus](https://prometheus-campus.com)"

**Always use markdown links**: [Prometheus Campus](https://prometheus-campus.com)

**Pain points to reference:**
- Stuck in time-for-money trap
- No system for scaling
- Working 60+ hours, barely earning enough
- No community or mentorship

**Campus offers:**
- Revenue roadmap: Rev 1 ($0-10k) → Rev 2 ($10-50k) → Rev 3 ($50k+)
- Proven templates & scripts
- Weekly coaching calls
- Community of successful coaches

## Response Rules
- English only
- SHORT responses (max 100 words for business topics)
- Campus link appears EARLY and at the END
- Be helpful but create desire for the full Campus system
- For client management questions: just answer directly, no Campus pitch`

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  messages: Message[]
  action?: {
    type: string
    params: Record<string, unknown>
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

    if (!openaiApiKey) {
      console.error('Missing OPENAI_API_KEY')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has AI access (subscription tier check)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    // For now, allow access during trial or with any active subscription
    // TODO: Implement proper tier checking (Pro/Elite only)
    const hasAiAccess = subscription !== null

    if (!hasAiAccess) {
      return new Response(
        JSON.stringify({ error: 'AI Assistant requires an active subscription' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { messages, action }: RequestBody = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Missing messages array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If action is requested, execute it
    if (action) {
      const actionResult = await executeAction(supabase, user.id, action)
      return new Response(
        JSON.stringify({ actionResult }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build context with coach's data
    const context = await buildCoachContext(supabase, user.id)

    // Prepare messages for OpenAI
    const systemMessage: Message = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n## Current Context:\n${context}`
    }

    const openaiMessages = [systemMessage, ...messages]

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('AI Assistant error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Build context string with coach's current data
 */
async function buildCoachContext(supabase: any, coachId: string): Promise<string> {
  const contextParts: string[] = []

  try {
    // Get coach profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', coachId)
      .single()

    if (profile) {
      contextParts.push(`Coach: ${profile.full_name}`)
    }

    // Get connected clients
    const { data: connections } = await supabase
      .from('coach_client_connections')
      .select(`
        client_id,
        status,
        chat_enabled,
        profiles!coach_client_connections_client_id_fkey (
          id,
          full_name
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'accepted')
      .limit(20)

    if (connections && connections.length > 0) {
      contextParts.push(`\n## Connected Clients (${connections.length}):`)

      for (const conn of connections) {
        const clientName = conn.profiles?.full_name || 'Unknown'
        const clientId = conn.client_id

        // Get recent workout activity for this client
        const { data: recentWorkouts } = await supabase
          .from('workout_sessions')
          .select('id, status, created_at')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false })
          .limit(5)

        const completedThisWeek = recentWorkouts?.filter((w: any) => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return w.status === 'completed' && new Date(w.created_at) > weekAgo
        }).length || 0

        // Get latest weight
        const { data: latestWeight } = await supabase
          .from('weight_logs')
          .select('weight_kg, logged_at')
          .eq('user_id', clientId)
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let clientInfo = `- **${clientName}** (ID: ${clientId.slice(0, 8)})`
        clientInfo += ` | Workouts this week: ${completedThisWeek}`
        if (latestWeight) {
          clientInfo += ` | Weight: ${latestWeight.weight_kg}kg`
        }
        clientInfo += ` | Chat: ${conn.chat_enabled ? 'enabled' : 'disabled'}`

        contextParts.push(clientInfo)
      }
    } else {
      contextParts.push('\nNo connected clients yet.')
    }

    // Get upcoming events
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('title, start_time, end_time, client_id')
      .eq('coach_id', coachId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5)

    if (upcomingEvents && upcomingEvents.length > 0) {
      contextParts.push(`\n## Upcoming Events:`)
      for (const event of upcomingEvents) {
        const startDate = new Date(event.start_time).toLocaleDateString('de-DE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
        contextParts.push(`- ${event.title} | ${startDate}`)
      }
    }

    // Get today's date for context
    const today = new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    contextParts.push(`\nCurrent date: ${today}`)

  } catch (error) {
    console.error('Error building context:', error)
    contextParts.push('Error loading some context data.')
  }

  return contextParts.join('\n')
}

/**
 * Execute an action requested by the AI
 */
async function executeAction(
  supabase: any,
  coachId: string,
  action: { type: string; params: Record<string, unknown> }
): Promise<{ success: boolean; message: string; data?: any }> {

  try {
    switch (action.type) {
      case 'send_message': {
        const { clientId, content } = action.params as { clientId: string; content: string }

        // Find or create conversation
        const { data: existingConv } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', coachId)
          .limit(100)

        let conversationId: string | null = null

        if (existingConv) {
          for (const conv of existingConv) {
            const { data: otherParticipant } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.conversation_id)
              .eq('user_id', clientId)
              .maybeSingle()

            if (otherParticipant) {
              conversationId = conv.conversation_id
              break
            }
          }
        }

        if (!conversationId) {
          // Create new conversation
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({})
            .select('id')
            .single()

          if (convError) throw convError
          conversationId = newConv.id

          // Add participants
          await supabase.from('conversation_participants').insert([
            { conversation_id: conversationId, user_id: coachId },
            { conversation_id: conversationId, user_id: clientId }
          ])
        }

        // Send message
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: coachId,
            content: content
          })
          .select()
          .single()

        if (msgError) throw msgError

        return { success: true, message: 'Message sent successfully', data: message }
      }

      case 'add_coach_note': {
        const { clientId, content } = action.params as { clientId: string; content: string }

        const { data: note, error } = await supabase
          .from('coach_notes')
          .insert({
            coach_id: coachId,
            client_id: clientId,
            content: content
          })
          .select()
          .single()

        if (error) throw error

        return { success: true, message: 'Note added successfully', data: note }
      }

      case 'create_event': {
        const { title, startTime, endTime, clientId } = action.params as {
          title: string
          startTime: string
          endTime: string
          clientId?: string
        }

        const { data: event, error } = await supabase
          .from('events')
          .insert({
            coach_id: coachId,
            client_id: clientId || null,
            title,
            start_time: startTime,
            end_time: endTime
          })
          .select()
          .single()

        if (error) throw error

        return { success: true, message: 'Event created successfully', data: event }
      }

      default:
        return { success: false, message: `Unknown action type: ${action.type}` }
    }
  } catch (error) {
    console.error('Action execution error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Action failed'
    }
  }
}
