-- restrict order select: only the buyer, store owner, or admin can list; public lookup happens via edge function or RPC by reference
DROP POLICY IF EXISTS "Anyone view by reference" ON public.orders;
CREATE POLICY "Buyers view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_user_id);
CREATE POLICY "Store owners view their orders" ON public.orders FOR SELECT USING (auth.uid() = store_owner_id);

-- public order tracking via SECURITY DEFINER function requiring both reference and phone
CREATE OR REPLACE FUNCTION public.track_order(_reference text, _phone text)
RETURNS TABLE (reference text, status order_status, recipient_phone text, amount numeric, created_at timestamptz, product_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.reference, o.status, o.recipient_phone, o.amount, o.created_at, p.name
  FROM public.orders o LEFT JOIN public.products p ON p.id = o.product_id
  WHERE o.reference = _reference AND o.recipient_phone = _phone
  LIMIT 1
$$;

-- lock down execute
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;