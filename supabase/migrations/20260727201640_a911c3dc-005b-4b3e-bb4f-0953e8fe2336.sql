CREATE OR REPLACE FUNCTION public.credit_agent_profit(_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF v_order.status = 'failed' OR v_order.status = 'refunded' THEN
    RETURN jsonb_build_object('success', true, 'skipped', 'not_successful');
  END IF;
  IF v_order.swift_order_id IS NULL AND v_order.status <> 'delivered' THEN
    RETURN jsonb_build_object('success', true, 'skipped', 'not_fulfilled');
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
$function$;

CREATE OR REPLACE FUNCTION public.trg_credit_agent_profit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered')
     OR (NEW.swift_order_id IS NOT NULL AND OLD.swift_order_id IS DISTINCT FROM NEW.swift_order_id) THEN
    PERFORM public.credit_agent_profit(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS orders_credit_agent_profit ON public.orders;
CREATE TRIGGER orders_credit_agent_profit
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trg_credit_agent_profit();

-- Activation payments: track agent activation via payment_transactions (purpose = 'agent_activation')
CREATE OR REPLACE FUNCTION public.activate_agent(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'agent')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.wallets (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.activate_agent(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_agent(uuid) TO service_role;