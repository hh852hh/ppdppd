import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/paymentUtils";
import { CheckCircle2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  product_name?: string;
  name?: string;
  quantity: number;
  price_at_time?: number;
  price?: number;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const orderNumber = searchParams.get("orderNumber");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!orderNumber || !amount) {
      navigate("/");
      return;
    }

    const fetchOrderItems = async () => {
      try {
        // First check if we have cart items in sessionStorage (for demo orders)
        const storedItems = sessionStorage.getItem('completedOrderItems');
        if (storedItems) {
          const items = JSON.parse(storedItems);
          setOrderItems(items);
          sessionStorage.removeItem('completedOrderItems');
          setLoading(false);
          return;
        }

        // Otherwise fetch from database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', orderNumber)
          .maybeSingle();

        if (orderError) throw orderError;
        
        if (!order) {
          setLoading(false);
          return;
        }

        // Then get the order items
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('product_name, quantity, price_at_time')
          .eq('order_id', order.id);

        if (itemsError) throw itemsError;

        setOrderItems(items || []);
      } catch (error) {
        console.error('Error fetching order items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderItems();
  }, [orderNumber, amount, navigate]);

  if (!orderNumber || !amount) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto shadow-card text-center">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl">付款成功！</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8 pb-8">
            <div className="space-y-4">
              <p className="text-xl text-muted-foreground">
                感謝您的訂購
              </p>
              
              <div className="bg-accent/5 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">訂單編號</span>
                  <span className="font-mono font-semibold">{orderNumber}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">付款金額</span>
                    <span className="text-3xl font-bold text-accent">
                      {formatPrice(parseInt(amount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              {!loading && orderItems.length > 0 && (
                <div className="bg-card border rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Package className="w-5 h-5" />
                    <span>訂購項目</span>
                  </div>
                  
                  <div className="space-y-3">
                    {orderItems.map((item, index) => {
                      const productName = item.product_name || item.name || '產品';
                      const price = item.price_at_time || item.price || 0;
                      
                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b last:border-b-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{productName}</p>
                            <p className="text-sm text-muted-foreground">
                              數量: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(price * item.quantity)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(price)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <p className="text-muted-foreground">
                您的訂單已確認並正在處理中。<br />
                我們會盡快為您安排發貨。
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
              >
                返回首頁
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/")}
              >
                繼續購物
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
