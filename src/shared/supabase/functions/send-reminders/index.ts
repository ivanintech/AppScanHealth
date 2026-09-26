import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get all active reminders
    const { data: reminders, error: remindersError } = await supabaseClient
      .from('supplement_reminders')
      .select('*')
      .eq('is_active', true)

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reminders' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const sentReminders = []

    for (const reminder of reminders || []) {
      try {
        // Check if user has already taken this supplement today
        const { data: todayLogs, error: logsError } = await supabaseClient
          .from('supplement_logs')
          .select('id')
          .eq('user_id', reminder.user_id)
          .eq('supplement_ean', reminder.supplement_ean)
          .gte('taken_at', `${today}T00:00:00.000Z`)
          .lt('taken_at', `${today}T23:59:59.999Z`)

        if (logsError) {
          console.error('Error checking today logs:', logsError)
          continue
        }

        // If user hasn't taken the supplement today, send reminder
        if (!todayLogs || todayLogs.length === 0) {
          // Get supplement details
          const { data: supplementData, error: supplementError } = await supabaseClient
            .from('products')
            .select('product_name, brands_tags')
            .eq('ean', reminder.supplement_ean)
            .single()

          if (supplementError) {
            console.error('Error fetching supplement data:', supplementError)
            continue
          }

          // Send notification (this would integrate with your notification service)
          const notificationSent = await sendNotification({
            userId: reminder.user_id,
            title: `¡Hora de tu ${supplementData.product_name}!`,
            message: `No olvides tomar tu ${supplementData.product_name}${supplementData.brands_tags ? ` de ${supplementData.brands_tags}` : ''}.`,
            data: {
              type: 'supplement_reminder',
              supplement_ean: reminder.supplement_ean,
              reminder_id: reminder.id
            }
          })

          if (notificationSent) {
            sentReminders.push({
              reminder_id: reminder.id,
              user_id: reminder.user_id,
              supplement_ean: reminder.supplement_ean
            })
          }
        }
      } catch (error) {
        console.error('Error processing reminder:', error)
        continue
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${reminders?.length || 0} reminders`,
        sent: sentReminders.length,
        sentReminders 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-reminders function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendNotification(notification: {
  userId: string;
  title: string;
  message: string;
  data?: any;
}): Promise<boolean> {
  try {
    // This would integrate with your notification service
    // For now, we'll just log it
    console.log('Sending notification:', notification)
    
    // In a real implementation, you would:
    // 1. Send push notification via FCM/APNS
    // 2. Send email notification
    // 3. Send in-app notification
    // 4. Update notification status in database
    
    return true
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}

async function sendMissedDoseReminder(userId: string, supplementEan: string) {
  try {
    // Get user's stack to find the supplement
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: stack, error: stackError } = await supabaseClient
      .from('user_supplement_stack_2')
      .select(`
        supplement_ean,
        supplements(product_name, brands_tags)
      `)
      .eq('user_id', userId)

    if (stackError) {
      console.error('Error fetching user stack:', stackError)
      return
    }

    const supplement = stack?.find(item => item.supplement_ean === supplementEan)
    if (!supplement) return

    // Check if user took it yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yesterdayLogs, error: logsError } = await supabaseClient
      .from('supplement_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('supplement_ean', supplementEan)
      .gte('taken_at', `${yesterdayStr}T00:00:00.000Z`)
      .lt('taken_at', `${yesterdayStr}T23:59:59.999Z`)

    if (logsError) {
      console.error('Error checking yesterday logs:', logsError)
      return
    }

    // If user didn't take it yesterday, send missed dose reminder
    if (!yesterdayLogs || yesterdayLogs.length === 0) {
      await sendNotification({
        userId,
        title: 'Dosis perdida ayer',
        message: `No tomaste tu ${supplement.supplements?.product_name} ayer. ¿Te sientes diferente hoy?`,
        data: {
          type: 'missed_dose_reminder',
          supplement_ean: supplementEan
        }
      })
    }
  } catch (error) {
    console.error('Error in sendMissedDoseReminder:', error)
  }
}

async function sendInteractionAlert(userId: string, supplementA: string, supplementB: string) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: stack, error: stackError } = await supabaseClient
      .from('user_supplement_stack_2')
      .select(`
        supplement_ean,
        supplements(product_name, brands_tags)
      `)
      .eq('user_id', userId)

    if (stackError) {
      console.error('Error fetching user stack:', stackError)
      return
    }

    const supplementA_data = stack?.find(item => item.supplement_ean === supplementA)
    const supplementB_data = stack?.find(item => item.supplement_ean === supplementB)

    if (supplementA_data && supplementB_data) {
      await sendNotification({
        userId,
        title: 'Posible interacción detectada',
        message: `${supplementA_data.supplements?.product_name} y ${supplementB_data.supplements?.product_name} pueden interactuar. Consulta con un profesional.`,
        data: {
          type: 'interaction_alert',
          supplement_a: supplementA,
          supplement_b: supplementB
        }
      })
    }
  } catch (error) {
    console.error('Error in sendInteractionAlert:', error)
  }
}
