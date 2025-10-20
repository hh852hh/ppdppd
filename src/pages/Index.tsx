import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

const Index = () => {
  const { data: products, isLoading } = useProducts();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            重拾自由移動
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            專業電動輪椅，為您提供舒適、安全、自主的出行體驗
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
          >
            選購輪椅
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">精選電動輪椅</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              多款型號可選，滿足不同需求與預算
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 MobilityPro HK. 專業電動輪椅供應商。</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
