export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PaymentRequest {
  version: string;
  service: string;
  companyNo: string;
  customerNo: string;
  signData: string;
  payType: 'WECHAT' | 'ALIPAY' | 'UNIONPAY';
  mcc: string;
  merOrderNo: string;
  amount: string;
  subject: string;
  desc?: string;
  realIp?: string;
  notifyUrl: string;
  timeExpire?: string;
}

export interface PaymentResponse {
  code: string;
  msg: string;
  version: string;
  service: string;
  signData: string;
  merOrderNo: string;
  plaOrderNo: string;
  qrCode?: string;
  tradeStatus?: string;
  tradeMsg?: string;
  payTime?: string;
}
