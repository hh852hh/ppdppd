import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/lib/mockProducts";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/paymentUtils";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const product = mockProducts.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">找不到產品</h1>
          <Button onClick={() => navigate("/")}>返回商店</Button>
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
          返回產品列表
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square overflow-hidden rounded-lg shadow-card">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <span className="text-sm font-medium text-accent">
                {product.category}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            
            <p className="text-3xl font-bold text-primary mb-6">
              {formatPrice(product.price)}
            </p>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => {
                  addToCart(product);
                  navigate("/cart");
                }}
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? "加入購物車並結帳" : "缺貨"}
              </Button>

              {product.inStock && (
                <p className="text-sm text-muted-foreground">
                  ✓ 有現貨，可立即出貨
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
