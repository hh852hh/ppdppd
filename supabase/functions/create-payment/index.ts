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
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  // Create data string in key=value format
  const dataString = filteredParams
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Append md5Key
  const dataTemp = `${dataString}&key=${PAYMENT_CONFIG.md5Key}`;

  // Calculate MD5 and convert to uppercase  
  const signData = md5(dataTemp);
  
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

    console.log('Creating payment:', { orderNo, amount, subject, payType });

    // Create payment request
    const paymentRequest = {
      version: "1.0.0",
      service: "trade.scanPay",
      companyNo: PAYMENT_CONFIG.companyNo,
      customerNo: getCustomerNo(payType),
      payType,
      mcc: PAYMENT_CONFIG.mcc,
      merOrderNo: orderNo,
      amount: amount.toString(),
      subject,
      notifyUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
      timeExpire: "30",
      areaCode: "HK",
    } as Record<string, string>;

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
