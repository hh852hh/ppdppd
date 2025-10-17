-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents
  image TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount INTEGER NOT NULL, -- Total in cents
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL, -- WECHAT, ALIPAY, UNIONPAY
  powerpay_order_no TEXT, -- Platform order number from PowerPay
  customer_email TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time INTEGER NOT NULL, -- Price per item at time of order in cents
  product_name TEXT NOT NULL, -- Store product name in case product is deleted later
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view products"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage products"
  ON public.products
  FOR ALL
  USING (auth.role() = 'service_role');

-- Orders policies
CREATE POLICY "Anyone can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage orders"
  ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- Order items policies
CREATE POLICY "Anyone can create order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "Service role can manage order items"
  ON public.order_items
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products from mockProducts
INSERT INTO public.products (name, description, price, image, stock) VALUES
  ('簡約背包', '經典設計，適合日常使用', 100000, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 50),
  ('運動水壺', '保溫保冷，容量充足', 25000, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 100),
  ('無線耳機', '高音質，長續航力', 80000, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', 30),
  ('智能手錶', '健康監測，訊息通知', 150000, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 20);