import { Product } from "@/types/product";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/paymentUtils";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden shadow-card hover:shadow-hover transition-smooth cursor-pointer group">
      <div 
        onClick={() => navigate(`/product/${product.id}`)}
        className="relative aspect-square overflow-hidden"
      >
        <img
          src={product.image}
          alt={`${product.name} 電動輪椅產品圖`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = "/placeholder.svg";
            img.alt = `${product.name} 電動輪椅產品圖（佔位圖）`;
          }}
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-lg font-semibold">缺貨</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
        <p className="text-xl font-bold text-primary">
          {formatPrice(product.price)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          disabled={!product.inStock}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          加入購物車
        </Button>
      </CardFooter>
    </Card>
  );
}
