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
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('WECHAT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handlePayment = async () => {
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
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error(error.message || 'Payment service error. Please try again.');
        return;
      }

      console.log('Payment response:', data);

      if (data?.code === '00' && data?.qrCode) {
        setQrCode(data.qrCode);
        toast.success("Payment QR code generated! Please scan to complete payment.");
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
    { id: 'WECHAT' as PaymentMethod, name: 'WeChat Pay', icon: '💬' },
    { id: 'ALIPAY' as PaymentMethod, name: 'Alipay', icon: '🅰️' },
    { id: 'UNIONPAY' as PaymentMethod, name: 'UnionPay', icon: '🏦' },
  ];

  if (qrCode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Scan to Pay</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-white p-8 rounded-lg inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
                  alt="Payment QR Code"
                  className="w-72 h-72"
                />
              </div>
              
              <div>
                <p className="text-lg font-semibold mb-2">Order Number: {orderNumber}</p>
                <p className="text-3xl font-bold text-accent mb-2">
                  {formatPrice(getTotal())}
                </p>
                <p className="text-muted-foreground">
                  Please scan the QR code with your {paymentMethods.find(p => p.id === selectedPayment)?.name} app
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
                  Try Another Method
                </Button>
                <Button
                  onClick={() => {
                    clearCart();
                    navigate("/");
                    toast.success("Order completed! (Demo mode)");
                  }}
                >
                  Complete Order (Demo)
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
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
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
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
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
                            Qty: {item.quantity}
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
                <h2 className="text-2xl font-bold mb-6">Order Total</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Fee</span>
                    <span>Free</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
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
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatPrice(getTotal())}`
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secured by PowerPay HK
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
