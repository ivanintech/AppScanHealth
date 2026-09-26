import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StackItem {
  supplement_ean: string;
  supplements: {
    product_name: string | null;
    brands_tags: string | null;
    categories_tags: string[] | null;
  } | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
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

    // Get user's supplement stack
    const { data: stackData, error: stackError } = await supabaseClient
      .from('user_supplement_stack')
      .select(`
        supplement_ean,
        supplements(product_name, brands_tags, categories_tags)
      `)
      .eq('user_id', user_id)

    if (stackError) {
      console.error('Error fetching user stack:', stackError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user stack' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recent supplement logs
    const { data: logsData, error: logsError } = await supabaseClient
      .from('supplement_logs')
      .select('supplement_ean, taken_at, mood_before, mood_after')
      .eq('user_id', user_id)
      .gte('taken_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('taken_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching supplement logs:', logsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch supplement logs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const stack = stackData as StackItem[]
    const logs = logsData || []

    // Generate insights based on the data
    const insights = generateInsights(stack, logs)

    return new Response(
      JSON.stringify({ insights }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ai-health-insights function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateInsights(stack: StackItem[], logs: any[]) {
  const insights = []

  // Analyze supplement diversity
  const categories = new Set()
  stack.forEach(item => {
    if (item.supplements?.categories_tags) {
      item.supplements.categories_tags.forEach(cat => categories.add(cat))
    }
  })

  if (categories.size < 3) {
    insights.push({
      type: 'diversity',
      title: 'Considera diversificar tu stack',
      message: `Tienes suplementos de ${categories.size} categorías. Una mayor diversidad puede ofrecer beneficios más completos.`,
      priority: 'medium'
    })
  }

  // Analyze consistency
  const recentLogs = logs.filter(log => 
    new Date(log.taken_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )
  
  if (recentLogs.length < stack.length * 3) {
    insights.push({
      type: 'consistency',
      title: 'Mejora tu consistencia',
      message: 'Has tomado menos del 50% de tus suplementos en los últimos 7 días. La consistencia es clave para ver resultados.',
      priority: 'high'
    })
  }

  // Analyze mood trends
  const moodLogs = logs.filter(log => log.mood_before && log.mood_after)
  if (moodLogs.length > 5) {
    const avgMoodImprovement = moodLogs.reduce((sum, log) => 
      sum + (log.mood_after - log.mood_before), 0) / moodLogs.length
    
    if (avgMoodImprovement > 1) {
      insights.push({
        type: 'positive',
        title: '¡Excelente progreso!',
        message: 'Has reportado mejoras consistentes en tu estado de ánimo. ¡Sigue así!',
        priority: 'low'
      })
    }
  }

  // Check for potential interactions
  const proteinSupplements = stack.filter(item => 
    item.supplements?.categories_tags?.some(cat => 
      cat.toLowerCase().includes('proteína') || cat.toLowerCase().includes('protein')
    )
  )

  const creatineSupplements = stack.filter(item => 
    item.supplements?.categories_tags?.some(cat => 
      cat.toLowerCase().includes('creatina') || cat.toLowerCase().includes('creatine')
    )
  )

  if (proteinSupplements.length > 0 && creatineSupplements.length > 0) {
    insights.push({
      type: 'interaction',
      title: 'Combinación sinérgica detectada',
      message: 'Tienes proteína y creatina en tu stack. Esta combinación puede potenciar los resultados de entrenamiento.',
      priority: 'low'
    })
  }

  return insights
}
