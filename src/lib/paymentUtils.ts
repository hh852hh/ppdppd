import { PaymentRequest } from "@/types/product";

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
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

// Generate sign data for payment request
export async function generateSignData(params: Record<string, string>): Promise<string> {
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
  const signData = await md5(dataTemp);
  return signData;
}

export function getCustomerNo(payType: 'WECHAT' | 'ALIPAY' | 'UNIONPAY'): string {
  if (payType === 'UNIONPAY') {
    return PAYMENT_CONFIG.customerNo.unionpay;
  }
  return PAYMENT_CONFIG.customerNo.wechatAlipay;
}

export function createPaymentRequest(
  orderNo: string,
  amount: number,
  subject: string,
  payType: 'WECHAT' | 'ALIPAY' | 'UNIONPAY'
): Omit<PaymentRequest, 'signData'> {
  return {
    version: "1.0.0",
    service: "trade.scanPay",
    companyNo: PAYMENT_CONFIG.companyNo,
    customerNo: getCustomerNo(payType),
    payType,
    mcc: PAYMENT_CONFIG.mcc,
    merOrderNo: orderNo,
    amount: amount.toString(),
    subject,
    notifyUrl: `${window.location.origin}/api/payment/notify`,
    timeExpire: "30",
  };
}

export function getPaymentUrl(): string {
  return PAYMENT_CONFIG.url;
}

export function formatPrice(price: number): string {
  return `HK$${(price / 100).toFixed(2)}`;
}

export function generateOrderNumber(): string {
  return `ORD${Date.now()}`;
}
