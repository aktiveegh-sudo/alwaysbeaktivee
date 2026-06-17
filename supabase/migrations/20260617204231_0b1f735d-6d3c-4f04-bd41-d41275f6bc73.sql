
CREATE OR REPLACE FUNCTION public.wallet_pay_for_order(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_order public.orders;
  v_balance numeric;
  v_already_paid boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.buyer_user_id IS NULL OR v_order.buyer_user_id <> v_user THEN
    RAISE EXCEPTION 'Not your order';
  END IF;
  IF v_order.swift_order_id IS NOT NULL THEN
    RAISE EXCEPTION 'Order already submitted';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user AND type = 'purchase'
      AND description LIKE '%' || v_order.reference || '%'
  ) INTO v_already_paid;
  IF v_already_paid THEN
    RAISE EXCEPTION 'Order already paid from wallet';
  END IF;

  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_user FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF v_balance < v_order.amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  UPDATE public.wallets
    SET balance = balance - v_order.amount, updated_at = now()
    WHERE user_id = v_user;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
  VALUES (v_user, -v_order.amount, 'purchase', 'Wallet purchase for order ' || v_order.reference);

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'reference', v_order.reference);
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_pay_for_order(uuid) TO authenticated;
