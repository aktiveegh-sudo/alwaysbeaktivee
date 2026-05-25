-- Fix RLS policies for payment processing
-- payment_transactions needs INSERT policy
CREATE POLICY "Allow insert payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone view payment transactions" ON public.payment_transactions FOR SELECT USING (true);

-- Make orders INSERT policy explicit for service role
-- Drop the existing policy and recreate it
DROP POLICY IF EXISTS "Anyone create orders" ON public.orders;
CREATE POLICY "Allow service role and anyone to create orders" ON public.orders FOR INSERT WITH CHECK (true);
