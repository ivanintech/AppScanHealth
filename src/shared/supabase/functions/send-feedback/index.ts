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
    const { user_id, feedback_type, message, rating, supplement_ean } = await req.json()

    if (!user_id || !feedback_type || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id, feedback_type, and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

    // Insert feedback into database
    const { data: feedbackData, error: insertError } = await supabaseClient
      .from('user_feedback')
      .insert([{
        user_id,
        feedback_type,
        message,
        rating,
        supplement_ean,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send notification to admin (optional)
    await sendAdminNotification({
      user_id,
      feedback_type,
      message,
      rating,
      supplement_ean
    })

    return new Response(
      JSON.stringify({ 
        message: 'Feedback saved successfully',
        data: feedbackData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-feedback function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendAdminNotification(feedback: {
  user_id: string;
  feedback_type: string;
  message: string;
  rating?: number;
  supplement_ean?: string;
}) {
  try {
    // This would integrate with your admin notification system
    // For now, we'll just log it
    console.log('New feedback received:', feedback)
    
    // In a real implementation, you would:
    // 1. Send email to admin
    // 2. Send Slack notification
    // 3. Update admin dashboard
    // 4. Store in admin notifications table
    
  } catch (error) {
    console.error('Error sending admin notification:', error)
  }
}
