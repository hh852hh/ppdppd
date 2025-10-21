import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/paymentUtils";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderNumber = searchParams.get("orderNumber");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!orderNumber || !amount) {
      navigate("/");
    }
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
