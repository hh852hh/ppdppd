import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Md5 } from "https://deno.land/std@0.119.0/hash/md5.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYMENT_CONFIG = {
  url: "https://www.powerpayhk.com/hkpay/native/service", // Production environment
  md5Key: Deno.env.get('POWERPAY_MD5_KEY')!,
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
  
  // Calculate MD5 and convert to uppercase  
  const signData = md5(dataTemp).toUpperCase();
  
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
    return 'trade.jsPay'; // JS payment for Alipay (works on web via redirect)
  }
  if (payType === 'UNIONPAY') {
    return 'secure.pay'; // Secure payment for UnionPay
  }
  return 'trade.scanPay'; // QR code payment for WeChat
}

// Input validation schema
const paymentSchema = z.object({
  orderNo: z.string().regex(/^ORD\d{13}$/, 'Invalid order number format'),
  amount: z.number().int().positive().max(10000000, 'Amount exceeds maximum'),
  subject: z.string().trim().min(1).max(32),
  payType: z.enum(['WECHAT', 'ALIPAY', 'UNIONPAY']),
  cardNo: z.string().regex(/^\d{16,19}$/).optional().or(z.literal(''))
}).refine((data) => {
  // Validate that cardNo is provided and valid for UNIONPAY
  if (data.payType === 'UNIONPAY') {
    return data.cardNo && data.cardNo.length >= 16 && data.cardNo.length <= 19 && /^\d+$/.test(data.cardNo);
  }
  return true;
}, {
  message: 'Valid card number (16-19 digits) is required for UnionPay payments',
  path: ['cardNo']
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validated = paymentSchema.parse(requestBody);
    const { orderNo, amount, subject, payType, cardNo } = validated;

    const safeSubject = subject.trim().slice(0, 32) || 'HK Shop Order';
    
    // Log only essential info
    console.log('Processing payment:', { orderNo, payType });

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

    // Add required fields for trade.wapPay (Alipay)
    if (service === 'trade.wapPay') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      paymentRequest.frontUrl = `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/checkout`;
    }

    // Add required fields for secure.pay (UnionPay)
    if (service === 'secure.pay') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      paymentRequest.frontUrl = `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/checkout`;
      // Enforce correct UnionPay channel as per docs
      paymentRequest.payType = 'UNIONPAY_INTL';
      // cardNo is validated to exist for UNIONPAY in the schema
      if (cardNo) {
        paymentRequest.cardNo = cardNo;
      }
    }

    // Generate signature
    const signData = generateSignData(paymentRequest as any);
    
    const requestWithSign = {
      ...paymentRequest,
      signData,
    };

    // Call payment API
    const response = await fetch(PAYMENT_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithSign),
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Payment gateway response parse error');
      return new Response(JSON.stringify({ 
        code: '99', 
        msg: 'Invalid response from payment gateway'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (data.code !== '00') {
      console.error('Payment error:', { code: data.code, orderNo });
      
      // Return business error as 200 so frontend can show message gracefully
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // For secure.pay, rename 'data' field to 'html' to match expected response format
    if (service === 'secure.pay' && data.data) {
      const responseData = {
        ...data,
        html: data.data,
      };
      delete responseData.data;
      
      return new Response(JSON.stringify(responseData), {
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
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      console.error('Payment validation failed');
      return new Response(JSON.stringify({ 
        code: '99',
        msg: 'Invalid payment request',
        errors: (error as any).issues
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.error('Payment processing error');
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process payment',
        code: '99'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
