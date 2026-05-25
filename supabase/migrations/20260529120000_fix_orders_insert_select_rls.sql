-- Fix orders RLS to allow anonymous/public order creation and immediate insert return

DROP POLICY IF EXISTS "Allow service role and anyone to create orders" ON public.orders;
CREATE POLICY "Allow service role and anyone to create orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone view by reference" ON public.orders;
CREATE POLICY "Anyone view by reference" ON public.orders FOR SELECT USING (true);
