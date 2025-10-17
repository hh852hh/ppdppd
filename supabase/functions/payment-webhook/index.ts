import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MD5 hash function
function md5(message: string): string {
  const hash = new Md5();
  hash.update(message);
  return hash.toString();
}

// Verify webhook signature from PowerPay
function verifySignature(params: Record<string, string>, receivedSignature: string): boolean {
  const md5Key = Deno.env.get('POWERPAY_MD5_KEY')!;
  
  // Filter out empty values and signData
  const filteredParams = Object.entries(params)
    .filter(([key, value]) => value !== '' && key !== 'signData')
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0));
  
  // Create signature string
  const dataString = filteredParams.map(([key, value]) => `${key}=${value}`).join('&');
  const dataTemp = `${dataString}&key=${md5Key}`;
  const expectedSignature = md5(dataTemp).toUpperCase();
  
  return expectedSignature === receivedSignature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    
    console.log('Payment webhook received:', { 
      merOrderNo: webhookData.merOrderNo,
      code: webhookData.code 
    });

    // Verify signature
    const { signData, ...params } = webhookData;
    if (!verifySignature(params, signData)) {
      console.error('Webhook signature verification failed');
      return new Response('FAIL', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Check payment was successful
    if (webhookData.code !== '00') {
      console.error('Payment failed:', { 
        code: webhookData.code,
        orderNo: webhookData.merOrderNo 
      });
      return new Response('FAIL', { headers: corsHeaders });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update order status to paid
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        powerpay_order_no: webhookData.plaOrderNo,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', webhookData.merOrderNo);

    if (error) {
      console.error('Failed to update order status:', error);
      return new Response('FAIL', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log('Order status updated to paid:', webhookData.merOrderNo);

    // Return success response as per PowerPay spec
    return new Response('SUCCESS', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (err) {
    const error = err as Error;
    console.error('Webhook processing error:', error.message);
    return new Response('FAIL', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
