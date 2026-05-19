CREATE TABLE IF NOT EXISTS public.store_product_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profit numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.store_product_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own store pricing"
ON public.store_product_pricing
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone view store pricing"
ON public.store_product_pricing
FOR SELECT
USING (true);

CREATE TRIGGER trg_store_product_pricing_updated
BEFORE UPDATE ON public.store_product_pricing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
