import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYMENT_CONFIG = {
  url: "https://www.powerpayhk.com/hkpay/native/service",
  md5Key: "94ed508f4bc242b88ddd0f0d644ebe7a",
  companyNo: "10088891",
  customerNo: {
    wechatAlipay: "606034480502001",
    unionpay: "572034480502002",
  },
  mcc: "8050",
};

// MD5 hash function
function md5(message: string): string {
  const hash = new Md5();
  hash.update(message);
  return hash.toString().toUpperCase();
}

function generateSignData(params: Record<string, string>): string {
  // Filter out empty values and signData itself
  const filteredParams = Object.entries(params)
    .filter(([key, value]) => value !== '' && key !== 'signData')
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0));

  // Create data string in key=value format
  const dataString = filteredParams
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Append md5Key
  const dataTemp = `${dataString}&key=${PAYMENT_CONFIG.md5Key}`;
  
  console.log('Signature data string:', dataTemp);

  // Calculate MD5 and convert to uppercase  
  const signData = md5(dataTemp);
  
  console.log('Generated signature:', signData);
  
  return signData;
}

function getCustomerNo(payType: string): string {
  if (payType === 'UNIONPAY') {
    return PAYMENT_CONFIG.customerNo.unionpay;
  }
  return PAYMENT_CONFIG.customerNo.wechatAlipay;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, amount, subject, payType } = await req.json();

    const xff = req.headers.get('x-forwarded-for') || '';
    const realIp = xff.split(',')[0].trim() || '127.0.0.1';

    const safeSubject = (subject || '').toString().slice(0, 32) || 'HK Shop Order';

    console.log('Creating payment:', { orderNo, amount, subject: safeSubject, payType, realIp });

    // Create payment request - only include fields that should be signed
    const paymentRequest: Record<string, string> = {
      amount: amount.toString(),
      companyNo: PAYMENT_CONFIG.companyNo,
      customerNo: getCustomerNo(payType),
      mcc: PAYMENT_CONFIG.mcc,
      merOrderNo: orderNo,
      notifyUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
      payType,
      service: "trade.scanPay",
      subject: safeSubject,
      timeExpire: "30",
      version: "1.0.0",
    };

    console.log('Payment request before signing:', paymentRequest);

    // Generate signature
    const signData = generateSignData(paymentRequest as any);
    
    const requestWithSign = {
      ...paymentRequest,
      signData,
    };

    console.log('Calling PowerPay API with request:', requestWithSign);

    // Call payment API
    const response = await fetch(PAYMENT_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithSign),
    });

    const responseText = await response.text();
    console.log('PowerPay API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return new Response(JSON.stringify({ code: '99', msg: 'Invalid response from payment gateway' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (data.code !== '00') {
      console.error('Payment API error:', data);
      // Return business error as 200 so frontend can show message gracefully
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const error = err as Error;
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process payment',
        code: '99'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
