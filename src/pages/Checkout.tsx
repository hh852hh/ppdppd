import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, generateOrderNumber } from "@/lib/paymentUtils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'UNIONPAY';

export default function Checkout() {
  const { items, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('UNIONPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState<string>('');

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handlePayment = async () => {
    // Validate card number for UnionPay
    if (selectedPayment === 'UNIONPAY' && !cardNumber.trim()) {
      toast.error('Please enter your card number');
      return;
    }

    setIsProcessing(true);
    try {
      const orderNo = generateOrderNumber();
      setOrderNumber(orderNo);
      
      const subject = items.length === 1 
        ? items[0].name 
        : `${items.length} items`;

      console.log('Initiating payment:', { orderNo, amount: getTotal(), subject, payType: selectedPayment });

      // Call backend Edge Function to create payment
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          orderNo,
          amount: getTotal(),
          subject,
          payType: selectedPayment,
          ...(selectedPayment === 'UNIONPAY' && { cardNo: cardNumber.replace(/\s/g, '') }),
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error(error.message || 'Payment service error. Please try again.');
        return;
      }

      console.log('Payment response:', data);

      if (data?.code === '00') {
        // For secure.pay (UnionPay gateway), render HTML form
        if (data?.html && selectedPayment === 'UNIONPAY') {
          // Create a temporary div to hold the HTML and auto-submit the form
          const div = document.createElement('div');
          div.innerHTML = data.html;
          document.body.appendChild(div);
          // The HTML contains auto-submit script, but we can also trigger it manually
          const form = div.querySelector('form');
          if (form) {
            form.submit();
          }
          return;
        }
        
        // For jsPay (Alipay), extract URL from payInfo
        if (data?.payInfo) {
          try {
            const payInfo = JSON.parse(data.payInfo);
            if (payInfo.aliPayUrl) {
              window.location.href = payInfo.aliPayUrl;
              return;
            }
          } catch (e) {
            console.error('Failed to parse payInfo:', e);
          }
        }
        
        // For WAP and gateway payments, redirect to payment URL
        if (data?.payUrl && (selectedPayment === 'ALIPAY' || selectedPayment === 'UNIONPAY')) {
          window.location.href = data.payUrl;
          return;
        }
        
        // For QR code payments (WeChat)
        if (data?.qrCode) {
          setQrCode(data.qrCode);
          toast.success("Payment QR code generated! Please scan to complete payment.");
        } else {
          toast.error("Payment URL not provided");
        }
      } else {
        toast.error(data?.msg || data?.error || "Payment initiation failed");
        return;
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    // { id: 'WECHAT' as PaymentMethod, name: '微信支付', icon: '💬' },
    // { id: 'ALIPAY' as PaymentMethod, name: '支付寶', icon: '🅰️' },
    { id: 'UNIONPAY' as PaymentMethod, name: '銀聯', icon: '🏦' },
  ];

  if (qrCode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl text-center">掃碼支付</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-white p-8 rounded-lg inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
                  alt="付款二維碼"
                  className="w-72 h-72"
                />
              </div>
              
              <div>
                <p className="text-lg font-semibold mb-2">訂單編號：{orderNumber}</p>
                <p className="text-3xl font-bold text-accent mb-2">
                  {formatPrice(getTotal())}
                </p>
                <p className="text-muted-foreground">
                  請使用您的{paymentMethods.find(p => p.id === selectedPayment)?.name}應用程式掃描二維碼
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQrCode(null);
                    setOrderNumber(null);
                  }}
                >
                  嘗試其他方式
                </Button>
                <Button
                  onClick={() => {
                    clearCart();
                    navigate("/");
                    toast.success("訂單已完成！（演示模式）");
                  }}
                >
                  完成訂單（演示）
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">結帳</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>付款方式</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-smooth ${
                        selectedPayment === method.id
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <span className="text-3xl">{method.icon}</span>
                      <span className="font-semibold text-lg">{method.name}</span>
                      {selectedPayment === method.id && (
                        <span className="ml-auto text-accent">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                
                {selectedPayment === 'UNIONPAY' && (
                  <div className="mt-6">
                    <label htmlFor="cardNumber" className="block text-sm font-medium mb-2">
                      銀聯卡號 UnionPay Card Number
                    </label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="請輸入您的銀聯卡號"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      maxLength={19}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>訂單項目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            數量：{item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-card sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">訂單總計</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">小計</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">付款手續費</span>
                    <span>免費</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>總計</span>
                      <span className="text-accent">{formatPrice(getTotal())}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    `支付 ${formatPrice(getTotal())}`
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  由 PowerPay HK 提供安全支付
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
