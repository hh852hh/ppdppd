import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update all products to use placeholder image
    const { data, error } = await supabaseClient
      .from('products')
      .update({ image: '/placeholder.svg' })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'All product images updated successfully', data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
