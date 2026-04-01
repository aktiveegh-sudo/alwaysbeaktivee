
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS custom_greeting text;

CREATE TABLE IF NOT EXISTS public.store_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  store_views integer NOT NULL DEFAULT 0,
  whatsapp_clicks integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store analytics" ON public.store_analytics FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert store analytics" ON public.store_analytics FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update store analytics" ON public.store_analytics FOR UPDATE TO public USING (true);
