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

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Route handling
    switch (true) {
      case path === '/recommendations' && method === 'GET':
        return await handleGetRecommendations(supabaseClient, user.id)
      
      case path === '/analyze-product' && method === 'POST':
        const { productEan } = await req.json()
        return await handleAnalyzeProduct(supabaseClient, user.id, productEan)
      
      case path === '/feedback' && method === 'POST':
        const feedbackData = await req.json()
        return await handleSubmitFeedback(supabaseClient, user.id, feedbackData)
      
      case path === '/history' && method === 'GET':
        return await handleGetHistory(supabaseClient, user.id)
      
      case path === '/nhanes-patterns' && method === 'GET':
        const demographicGroup = url.searchParams.get('demographic_group')
        return await handleGetNHANESPatterns(supabaseClient, demographicGroup)
      
      case path === '/clinical-evidence' && method === 'GET':
        const supplementEan = url.searchParams.get('supplement_ean')
        return await handleGetClinicalEvidence(supabaseClient, supplementEan)
      
      case path === '/biomarker-analysis' && method === 'GET':
        return await handleGetBiomarkerAnalysis(supabaseClient, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in recommendations function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Handler para obtener recomendaciones
async function handleGetRecommendations(supabaseClient: any, userId: string) {
  try {
    // Obtener datos del usuario
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Usuario no encontrado')
    }

    // Obtener logs de suplementos
    const { data: supplementLogs, error: logsError } = await supabaseClient
      .from('supplement_logs')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(100)

    // Obtener stack actual
    const { data: currentStack, error: stackError } = await supabaseClient
      .from('user_supplement_stack')
      .select('*')
      .eq('user_id', userId)

    // Obtener datos de salud
    const { data: healthData, error: healthError } = await supabaseClient
      .from('health_data_imports')
      .select('*')
      .eq('user_id', userId)
      .order('import_date', { ascending: false })
      .limit(50)

    // Simular motor de recomendación (aquí integrarías el motor real)
    const recommendations = {
      recommendations: [
        {
          supplement_ean: 'VITAMIN_D_001',
          supplement_name: 'Vitamina D3',
          score: 0.85,
          confidence: 0.9,
          reasons: ['deficiency_match', 'similar_users'],
          benefits: ['Mejora absorción de calcio', 'Fortalece sistema inmune'],
          dosage_recommendation: '1000 UI diarias',
          timing_recommendation: 'Con el desayuno',
          interactions_warnings: ['Evitar con calcio en exceso'],
          contraindications: ['Hipercalcemia']
        }
      ],
      confidence_score: 0.85,
      deficiency_analysis: {
        deficiencies: ['vitamin_d', 'magnesium'],
        severity: 'moderate'
      },
      collaborative_filtering: {
        similar_users: 150,
        success_rate: 0.78
      },
      content_based: {
        health_goals_match: 0.9,
        lifestyle_match: 0.8
      }
    }

    // Guardar recomendaciones
    const { error: saveError } = await supabaseClient
      .from('ai_recommendations')
      .insert({
        user_id: userId,
        recommendation_type: 'supplement',
        title: 'Recomendaciones de Suplementos',
        content: recommendations,
        confidence_score: recommendations.confidence_score,
        status: 'pending'
      })

    return new Response(
      JSON.stringify(recommendations),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Error obteniendo recomendaciones' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Handler para analizar producto
async function handleAnalyzeProduct(supabaseClient: any, userId: string, productEan: string) {
  try {
    // Obtener datos del producto
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('ean', productEan)
      .single()

    if (productError || !product) {
      throw new Error('Producto no encontrado')
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Usuario no encontrado')
    }

    // Simular análisis del producto
    const analysis = {
      compatibility_score: 0.8,
      is_suitable: true,
      benefits: ['Mejora absorción de calcio', 'Fortalece sistema inmune'],
      interactions: [
        {
          supplement_ean: 'CALCIUM_001',
          interaction_type: 'positive',
          severity: 'low',
          description: 'Vitamina D mejora la absorción de calcio'
        }
      ],
      warnings: ['Evitar en caso de hipercalcemia'],
      recommendations: {
        dosage: '1000 UI diarias',
        timing: 'Con el desayuno',
        duration: '3-6 meses'
      }
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error analyzing product:', error)
    return new Response(
      JSON.stringify({ error: 'Error analizando producto' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Handler para enviar feedback
async function handleSubmitFeedback(supabaseClient: any, userId: string, feedbackData: any) {
  try {
    const { error } = await supabaseClient
      .from('recommendation_feedback')
      .insert({
        user_id: userId,
        recommendation_id: feedbackData.recommendation_id,
        feedback_type: feedbackData.type,
        rating: feedbackData.rating,
        comments: feedbackData.comments
      })

    if (error) {
      throw new Error('Error guardando feedback')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return new Response(
      JSON.stringify({ error: 'Error enviando feedback' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Handler para obtener historial
async function handleGetHistory(supabaseClient: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Error obteniendo historial')
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting history:', error)
    return new Response(
      JSON.stringify({ error: 'Error obteniendo historial' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Handler para obtener patrones NHANES
async function handleGetNHANESPatterns(supabaseClient: any, demographicGroup?: string) {
  try {
    let query = supabaseClient
      .from('nhanes_patterns')
      .select('*')

    if (demographicGroup) {
      query = query.eq('demographic_group', demographicGroup)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Error obteniendo patrones NHANES')
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting NHANES patterns:', error)
    return new Response(
      JSON.stringify({ error: 'Error obteniendo patrones NHANES' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Handler para obtener evidencia clínica
async function handleGetClinicalEvidence(supabaseClient: any, supplementEan?: string) {
  try {
    let query = supabaseClient
      .from('clinical_evidence')
      .select('*')

    if (supplementEan) {
      query = query.eq('supplement_ean', supplementEan)
    }

    const { data, error } = await query
      .order('effectiveness_score', { ascending: false })

    if (error) {
      throw new Error('Error obteniendo evidencia clínica')
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting clinical evidence:', error)
    return new Response(
      JSON.stringify({ error: 'Error obteniendo evidencia clínica' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Handler para obtener análisis de biomarcadores
async function handleGetBiomarkerAnalysis(supabaseClient: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('biomarker_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })

    if (error) {
      throw new Error('Error obteniendo análisis de biomarcadores')
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting biomarker analysis:', error)
    return new Response(
      JSON.stringify({ error: 'Error obteniendo análisis de biomarcadores' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}




