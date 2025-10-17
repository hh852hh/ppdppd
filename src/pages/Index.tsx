import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts } from "@/lib/mockProducts";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            探索優質產品
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            選購最新系列，享受PowerPay HK安全付款服務
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
          >
            瀏覽商品
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">精選產品</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              為挑剔的顧客精心挑選的優質商品
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 HK Shop. 由 PowerPay HK 提供支付服務。</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
