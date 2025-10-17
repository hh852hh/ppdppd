-- Fix RLS policies to prevent guest order PII exposure
-- This removes the dangerous 'user_id IS NULL' condition that exposed all guest customer data

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;

-- Add order_token column for secure guest access
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_token ON public.orders(order_token);

-- Recreate orders SELECT policy without NULL check
-- Users can only view their authenticated orders
-- Guest orders require order_token (to be implemented in application layer)
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Recreate order_items SELECT policy without NULL check
CREATE POLICY "Users can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);