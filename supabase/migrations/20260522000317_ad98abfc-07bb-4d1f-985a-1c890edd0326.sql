
-- Allow admins to insert wallet transactions (for credits/adjustments)
CREATE POLICY "Admins insert transactions" ON public.wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bootstrap RPC: claim the first admin role if none exists yet.
-- This lets the very first signed-in user promote themselves to admin
-- without needing to use the Supabase SQL editor. Once an admin exists,
-- this function refuses to grant further admins.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be signed in';
  END IF;
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count > 0 THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

-- Admin role assignment RPC
CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role app_role, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
    -- Ensure wallet row exists for agents/subagents
    IF _role IN ('agent', 'subagent') THEN
      INSERT INTO public.wallets (user_id) VALUES (_user_id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
END;
$$;

-- Admin credit/debit wallet RPC
CREATE OR REPLACE FUNCTION public.admin_credit_wallet(
  _user_id uuid,
  _amount numeric,
  _description text DEFAULT 'Admin adjustment'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets
  SET balance = balance + _amount,
      total_earned = total_earned + GREATEST(_amount, 0),
      updated_at = now()
  WHERE user_id = _user_id;
  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
  VALUES (_user_id, _amount, 'admin_credit', _description);
END;
$$;

-- Admin search users (joins auth.users for email since profiles may not have it)
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT '')
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  phone text,
  is_suspended boolean,
  created_at timestamptz,
  roles app_role[],
  balance numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.is_suspended,
    p.created_at,
    COALESCE(ARRAY(SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = p.id), '{}'::app_role[]) AS roles,
    COALESCE((SELECT w.balance FROM public.wallets w WHERE w.user_id = p.id), 0) AS balance
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
    AND (
      _search = ''
      OR p.email ILIKE '%' || _search || '%'
      OR p.full_name ILIKE '%' || _search || '%'
      OR p.phone ILIKE '%' || _search || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT 100;
$$;

-- Admin overview stats RPC
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT jsonb_build_object(
    'total_orders', (SELECT count(*) FROM public.orders),
    'orders_today', (SELECT count(*) FROM public.orders WHERE created_at >= current_date),
    'revenue_total', (SELECT COALESCE(sum(amount), 0) FROM public.orders WHERE status = 'delivered'),
    'revenue_today', (SELECT COALESCE(sum(amount), 0) FROM public.orders WHERE status = 'delivered' AND created_at >= current_date),
    'processing_orders', (SELECT count(*) FROM public.orders WHERE status = 'processing'),
    'failed_orders', (SELECT count(*) FROM public.orders WHERE status = 'failed'),
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_agents', (SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role IN ('agent', 'subagent')),
    'pending_withdrawals', (SELECT count(*) FROM public.withdrawal_requests WHERE status = 'pending'),
    'pending_withdrawal_amount', (SELECT COALESCE(sum(amount), 0) FROM public.withdrawal_requests WHERE status = 'pending'),
    'total_wallet_balance', (SELECT COALESCE(sum(balance), 0) FROM public.wallets),
    'active_products', (SELECT count(*) FROM public.products WHERE is_active = true)
  ) INTO result;
  RETURN result;
END;
$$;
