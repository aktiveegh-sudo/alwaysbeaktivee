DROP POLICY IF EXISTS "Service role update orders" ON public.orders;
DROP POLICY IF EXISTS "Users update own orders" ON public.orders;

DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users insert own wallet" ON public.wallets;

DROP POLICY IF EXISTS "Service role insert transactions" ON public.wallet_transactions;

DROP POLICY IF EXISTS "Allow insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Anyone view payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role update transactions" ON public.payment_transactions;