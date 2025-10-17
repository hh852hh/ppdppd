import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/paymentUtils";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, getTotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">您的購物車是空的</h2>
          <p className="text-muted-foreground mb-8">
            添加一些產品開始購物
          </p>
          <Button onClick={() => navigate("/")}>繼續購物</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          繼續購物
        </Button>

        <h1 className="text-4xl font-bold mb-8">購物車</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {item.category}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="shadow-card sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">訂單摘要</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>小計</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>運費</span>
                    <span>免費</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>總計</span>
                      <span>{formatPrice(getTotal())}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  前往結帳
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
