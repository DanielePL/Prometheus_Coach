import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Event {
  id: string
  title: string
  start_time: string
  assigned_to: string
  created_by: string
  reminders: number[]
  description: string | null
  event_type: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting reminder check at:', new Date().toISOString())

    // Get the current time
    const now = new Date()
    
    // Get all events that have reminders and are in the future
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, title, start_time, assigned_to, created_by, reminders, description, event_type')
      .gte('start_time', now.toISOString())
      .not('reminders', 'is', null)
      .neq('reminders', '{}')

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      throw eventsError
    }

    console.log(`Found ${events?.length || 0} events with reminders`)

    let notificationsSent = 0

    // Check each event for due reminders
    for (const event of events || []) {
      const eventStart = new Date(event.start_time)
      
      // Check each reminder time
      for (const reminderMinutes of event.reminders) {
        // Calculate when this reminder should be sent
        const reminderTime = new Date(eventStart.getTime() - reminderMinutes * 60 * 1000)
        
        // Check if we should send this reminder (within the last minute to account for cron interval)
        const timeDiff = now.getTime() - reminderTime.getTime()
        const shouldSend = timeDiff >= 0 && timeDiff < 60000 // Within last minute
        
        if (shouldSend) {
          // Check if we've already sent this reminder
          const { data: existingNotification } = await supabaseClient
            .from('notifications')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', event.assigned_to || event.created_by)
            .ilike('message', `%${getReminderText(reminderMinutes)}%`)
            .gte('created_at', new Date(now.getTime() - 2 * 60 * 1000).toISOString()) // Check last 2 minutes
            .single()

          if (!existingNotification) {
            // Create notification for the assigned user or creator
            const targetUserId = event.assigned_to || event.created_by
            const reminderText = getReminderText(reminderMinutes)
            
            const { error: notificationError } = await supabaseClient
              .from('notifications')
              .insert({
                user_id: targetUserId,
                event_id: event.id,
                message: `${reminderText}: ${event.title}`,
              })

            if (notificationError) {
              console.error('Error creating notification:', notificationError)
            } else {
              console.log(`Sent ${reminderText} for event: ${event.title}`)
              notificationsSent++
            }
          } else {
            console.log(`Reminder already sent for event: ${event.title} (${reminderMinutes} minutes)`)
          }
        }
      }
    }

    console.log(`Reminder check complete. Sent ${notificationsSent} notifications`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventsChecked: events?.length || 0,
        notificationsSent,
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in send-event-reminders function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function getReminderText(minutes: number): string {
  if (minutes === 15) return 'Reminder: Event starts in 15 minutes'
  if (minutes === 60) return 'Reminder: Event starts in 1 hour'
  if (minutes === 1440) return 'Reminder: Event starts in 1 day'
  if (minutes < 60) return `Reminder: Event starts in ${minutes} minutes`
  if (minutes < 1440) return `Reminder: Event starts in ${Math.floor(minutes / 60)} hours`
  return `Reminder: Event starts in ${Math.floor(minutes / 1440)} days`
}
