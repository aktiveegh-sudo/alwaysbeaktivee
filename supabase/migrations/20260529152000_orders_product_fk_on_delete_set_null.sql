-- Make orders.product_id NULL when the referenced product is deleted
-- This avoids FK violations when removing or updating products that have existing orders.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
