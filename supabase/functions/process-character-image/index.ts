
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user ID from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const formData = await req.formData()
    const imageFile = formData.get('image') as File
    const characterName = formData.get('characterName') as string
    const genre = formData.get('genre') as string
    const prompt = formData.get('prompt') as string

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    //console.log('Processing image for character:', characterName, 'genre:', genre)

    // Create illustrative prompt for img2img
    const illustrativePrompt = `${prompt || `${characterName} as a character in a ${genre} story`}, beautiful illustration, children's book style, cartoon style, friendly and colorful, high quality digital art`

    // Call Hugging Face img2img API
    const hfApiKey = Deno.env.get('HUGGING_FACE_API_KEY')
    if (!hfApiKey) {
      throw new Error('Hugging Face API key not configured')
    }

    const hfFormData = new FormData()
    hfFormData.append('image', imageFile)
    hfFormData.append('prompt', illustrativePrompt)
    hfFormData.append('num_inference_steps', '50')
    hfFormData.append('guidance_scale', '7.5')
    hfFormData.append('strength', '0.7')

    //console.log('Calling Hugging Face img2img API...')
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
      },
      body: hfFormData,
    })

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      console.error('Hugging Face API error:', hfResponse.status, errorText)
      throw new Error(`Hugging Face API error: ${hfResponse.status} - ${errorText}`)
    }

    const processedImageBlob = await hfResponse.blob()
    //console.log('Image processed successfully, size:', processedImageBlob.size)

    // Upload processed image to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_processed_${imageFile.name}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('character-images')
      .upload(fileName, processedImageBlob, {
        contentType: 'image/png',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Failed to upload processed image: ${uploadError.message}`)
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabaseClient.storage
      .from('character-images')
      .getPublicUrl(fileName)

    // Save record to database
    const { data: dbData, error: dbError } = await supabaseClient
      .from('character_images')
      .insert({
        user_id: user.id,
        original_filename: imageFile.name,
        processed_image_url: urlData.publicUrl,
        character_name: characterName,
        genre: genre,
        prompt_used: illustrativePrompt,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save to database: ${dbError.message}`)
    }

    //console.log('Image processing completed successfully')
    return new Response(
      JSON.stringify({
        success: true,
        processed_image_url: urlData.publicUrl,
        record: dbData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-character-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
