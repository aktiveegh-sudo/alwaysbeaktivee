
-- 1. Widen swift_order_id to text (was UUID; new reseller returns text references)
ALTER TABLE public.orders ALTER COLUMN swift_order_id TYPE text USING swift_order_id::text;

-- 2. Function to credit an agent's wallet on successful delivery (idempotent)
CREATE OR REPLACE FUNCTION public.credit_agent_profit(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_already boolean;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
  IF v_order.store_owner_id IS NULL THEN RETURN jsonb_build_object('success', true, 'skipped', 'no_owner'); END IF;
  IF COALESCE(v_order.agent_profit, 0) <= 0 THEN RETURN jsonb_build_object('success', true, 'skipped', 'no_profit'); END IF;
  IF v_order.buyer_user_id IS NOT NULL AND v_order.buyer_user_id = v_order.store_owner_id THEN
    RETURN jsonb_build_object('success', true, 'skipped', 'self_purchase');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_order.store_owner_id
      AND type = 'sale_profit'
      AND description LIKE '%' || v_order.reference || '%'
  ) INTO v_already;
  IF v_already THEN RETURN jsonb_build_object('success', true, 'skipped', 'already_credited'); END IF;

  INSERT INTO public.wallets (user_id, balance) VALUES (v_order.store_owner_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets
    SET balance = balance + v_order.agent_profit,
        total_earned = total_earned + v_order.agent_profit,
        updated_at = now()
    WHERE user_id = v_order.store_owner_id;
  INSERT INTO public.wallet_transactions (user_id, amount, type, description, reference)
    VALUES (v_order.store_owner_id, v_order.agent_profit, 'sale_profit',
            'Profit from sale ' || v_order.reference, v_order.reference);

  RETURN jsonb_build_object('success', true, 'credited', v_order.agent_profit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.credit_agent_profit(uuid) TO service_role;

-- 3. Add 'sale_profit' to the wallet_transactions type check if it's an enum, else skip.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'wallet_transaction_type'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'wallet_transaction_type' AND e.enumlabel = 'sale_profit'
    ) THEN
      ALTER TYPE public.wallet_transaction_type ADD VALUE 'sale_profit';
    END IF;
  END IF;
END $$;
