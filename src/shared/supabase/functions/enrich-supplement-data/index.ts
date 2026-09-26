import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SupplementData {
  ean: string;
  _keywords: string;
  product_name?: string;
  brands_tags?: string;
  categories_tags?: string;
  countries_tags?: string;
  additives_tags?: string;
  known_ingredients_n?: number;
  unknown_ingredients_n?: number;
  ingredients_analysis_tags?: string;
  labels_tags?: string;
  ingredients_text?: string;
  ingredients_tags?: string;
  ingredients_text_with_allergens?: string;
  allergens_tags?: string;
  image_url?: string;
  image_nutrition_url?: string;
  image_ingredients_url?: string;
  serving_quantity?: number;
  serving_quantity_unit?: string;
  traces_tags?: string;
  nutriscore_score?: number;
  nutriments?: any;
  nutrient_levels?: any;
  nova_groups_markers?: any;
  category_id?: string;
  subcategory_id?: string;
  calculated_score?: number;
  created_at?: string;
  updated_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ean } = await req.json()

    if (!ean) {
      return new Response(
        JSON.stringify({ error: 'EAN is required' }),
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

    // Check if supplement already exists
    const { data: existingData, error: checkError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('ean', ean)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing supplement:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing supplement' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (existingData) {
      return new Response(
        JSON.stringify({ 
          message: 'Supplement already exists',
          data: existingData 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch data from OpenFoodFacts API
    let enrichedData: SupplementData = { ean, _keywords: ean }

    try {
      const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${ean}`)
      const data = await response.json()

      if (data.product) {
        const product = data.product

        // Map OpenFoodFacts data to our schema
        enrichedData.product_name = product.product_name || product.product_name_es || product.product_name_en
        enrichedData.brands_tags = product.brands
        enrichedData.categories_tags = product.categories_tags ? product.categories_tags.join(',') : null
        enrichedData.countries_tags = product.countries_tags ? product.countries_tags.join(',') : null
        enrichedData.additives_tags = product.additives_tags ? product.additives_tags.join(',') : null
        enrichedData.known_ingredients_n = product.known_ingredients_n
        enrichedData.unknown_ingredients_n = product.unknown_ingredients_n
        enrichedData.ingredients_analysis_tags = product.ingredients_analysis_tags ? product.ingredients_analysis_tags.join(',') : null
        enrichedData.labels_tags = product.labels_tags ? product.labels_tags.join(',') : null
        enrichedData.ingredients_text = product.ingredients_text
        enrichedData.ingredients_tags = product.ingredients_tags ? product.ingredients_tags.join(',') : null
        enrichedData.ingredients_text_with_allergens = product.ingredients_text_with_allergens
        enrichedData.allergens_tags = product.allergens_tags ? product.allergens_tags.join(',') : null
        enrichedData.image_url = product.image_url
        enrichedData.image_nutrition_url = product.image_nutrition_url
        enrichedData.image_ingredients_url = product.image_ingredients_url
        enrichedData.serving_quantity = product.serving_quantity
        enrichedData.serving_quantity_unit = product.serving_quantity_unit
        enrichedData.traces_tags = product.traces_tags ? product.traces_tags.join(',') : null
        enrichedData.nutriscore_score = product.nutriscore_score
        enrichedData.nutriments = product.nutriments
        enrichedData.nutrient_levels = product.nutrient_levels
        enrichedData.nova_groups_markers = product.nova_groups_markers

        // Calculate a basic score based on available data
        enrichedData.calculated_score = calculateBasicScore(product)
      } else {
        // If no data from OpenFoodFacts, generate fallback data
        enrichedData = { ...enrichedData, ...await generateFallbackData(ean) }
      }
    } catch (apiError) {
      console.error('Error fetching from OpenFoodFacts:', apiError)
      // Generate fallback data if API fails
      enrichedData = { ...enrichedData, ...await generateFallbackData(ean) }
    }

    // Insert the enriched data into the database
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('products')
      .insert([{
        ...enrichedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting supplement:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert supplement' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Supplement enriched and saved successfully',
        data: insertedData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in enrich-supplement-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function calculateBasicScore(product: any): number {
  let score = 50 // Base score

  // Add points for having complete information
  if (product.product_name) score += 10
  if (product.brands) score += 5
  if (product.ingredients_text) score += 10
  if (product.image_url) score += 5
  if (product.nutriments) score += 10
  if (product.nutriscore_score !== undefined) score += 5

  // Add points for good nutriscore
  if (product.nutriscore_score && product.nutriscore_score >= 3) {
    score += 10
  }

  // Add points for having few unknown ingredients
  if (product.unknown_ingredients_n !== undefined && product.unknown_ingredients_n <= 2) {
    score += 5
  }

  return Math.min(score, 100) // Cap at 100
}

async function generateFallbackData(ean: string): Promise<Partial<SupplementData>> {
  const fallbackData: Partial<SupplementData> = {
    product_name: `Suplemento ${ean.slice(-4)}`,
    brands_tags: 'Marca no identificada',
    categories_tags: 'supplements,health',
    calculated_score: 50
  }

  return fallbackData
}
