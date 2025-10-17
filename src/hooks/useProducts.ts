import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database products to match Product type
      return data.map((product): Product => ({
        id: product.id,
        name: product.name,
        price: product.price, // Already in cents
        description: product.description || '',
        image: product.image,
        category: 'Products', // You can add category to DB later if needed
        inStock: product.stock > 0,
      }));
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform database product to match Product type
      return {
        id: data.id,
        name: data.name,
        price: data.price,
        description: data.description || '',
        image: data.image,
        category: 'Products',
        inStock: data.stock > 0,
      } as Product;
    },
    enabled: !!id,
  });
};
