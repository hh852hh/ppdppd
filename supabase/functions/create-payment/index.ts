import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYMENT_CONFIG = {
  url: "https://www.powerpayhk.com/hkpay/native/service", // Production environment
  md5Key: Deno.env.get('POWERPAY_MD5_KEY') || "94ed508f4bc242b88ddd0f0d644ebe7a",
  companyNo: "10088891",
  customerNo: {
    wechatAlipay: "606034459212007",
    unionpay: "572034459212008",
  },
  mcc: "5921",
};

// MD5 hash function
function md5(message: string): string {
  const hash = new Md5();
  hash.update(message);
  return hash.toString();
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
  const signData = md5(dataTemp).toUpperCase();
  
  console.log('Generated signature:', signData);
  
  return signData;
}

function getCustomerNo(payType: string): string {
  if (payType === 'UNIONPAY') {
    return PAYMENT_CONFIG.customerNo.unionpay;
  }
  return PAYMENT_CONFIG.customerNo.wechatAlipay;
}

function getService(payType: string): string {
  if (payType === 'ALIPAY') {
    return 'trade.jsPay'; // JS payment for Alipay
  }
  if (payType === 'UNIONPAY') {
    return 'secure.pay'; // Secure payment for UnionPay
  }
  return 'trade.scanPay'; // QR code payment for WeChat
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, amount, subject, payType } = await req.json();

    const safeSubject = (subject || '').toString().slice(0, 32) || 'HK Shop Order';

    console.log('Creating payment:', { orderNo, amount, subject: safeSubject, payType });
    console.log('PAYMENT_CONFIG:', { 
      url: PAYMENT_CONFIG.url,
      companyNo: PAYMENT_CONFIG.companyNo,
      customerNo: getCustomerNo(payType),
      mcc: PAYMENT_CONFIG.mcc 
    });

    // Create payment request matching API documentation example
    const service = getService(payType);
    const paymentRequest: Record<string, string> = {
      amount: amount.toString(),
      companyNo: PAYMENT_CONFIG.companyNo,
      customerNo: getCustomerNo(payType),
      desc: safeSubject,
      mcc: PAYMENT_CONFIG.mcc,
      merOrderNo: orderNo,
      notifyUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
      payType,
      realIp: "127.0.0.1",
      service,
      subject: safeSubject,
      timeExpire: "30",
      version: "1.0.0",
    };

    // Add required fields for secure.pay (UnionPay)
    if (service === 'secure.pay') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      paymentRequest.frontUrl = `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/checkout`;
      // Send BankCustomer as JSON string as required by gateway
      const bankCustomer = {
        name: "Test User",
        mobile: "85212345678",
        idNo: "A123456(7)",
        idType: "HKID",
        email: "test@example.com",
      };
      paymentRequest.BankCustomer = JSON.stringify(bankCustomer);
      // Clean any previously set flat fields if present
      delete (paymentRequest as any).bankCustomerName;
      delete (paymentRequest as any).bankCustomerMobile;
      delete (paymentRequest as any).bankCustomerIdNo;
      delete (paymentRequest as any).bankCustomerEmail;
    }
    
    console.log('Using service:', service, 'for payType:', payType);

    console.log('Payment request before signing:', JSON.stringify(paymentRequest, null, 2));

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
    console.log('PowerPay API RAW response:', responseText);
    console.log('PowerPay API response status:', response.status);
    console.log('PowerPay API response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.error('Response was:', responseText);
      return new Response(JSON.stringify({ 
        code: '99', 
        msg: 'Invalid response from payment gateway',
        rawResponse: responseText 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('PowerPay API parsed response:', JSON.stringify(data, null, 2));

    if (data.code !== '00') {
      console.error('Payment API error - code:', data.code);
      console.error('Payment API error - msg:', data.msg);
      console.error('Payment API full error response:', JSON.stringify(data, null, 2));
      
      // Return business error as 200 so frontend can show message gracefully
      return new Response(JSON.stringify({
        ...data,
        debugInfo: {
          requestSent: requestWithSign,
          responseReceived: data
        }
      }), {
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
