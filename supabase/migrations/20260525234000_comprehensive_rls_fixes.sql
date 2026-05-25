-- Comprehensive RLS Policy Fixes for All Tables

-- ============ api_keys ============
CREATE POLICY "Users insert own api keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users select own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own api keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own api keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- ============ free_data_campaigns ============
CREATE POLICY "Admins insert campaigns" ON public.free_data_campaigns FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update campaigns" ON public.free_data_campaigns FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete campaigns" ON public.free_data_campaigns FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ============ free_data_codes ============
CREATE POLICY "Admins insert codes" ON public.free_data_codes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update codes" ON public.free_data_codes FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete codes" ON public.free_data_codes FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ============ orders ============
CREATE POLICY "Users update own orders" ON public.orders FOR UPDATE USING (auth.uid() = buyer_user_id OR auth.uid() = store_owner_id) WITH CHECK (auth.uid() = buyer_user_id OR auth.uid() = store_owner_id);
CREATE POLICY "Service role update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- ============ payment_provider_settings ============
CREATE POLICY "Admins manage provider settings" ON public.payment_provider_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone view provider settings" ON public.payment_provider_settings FOR SELECT USING (true);

-- ============ payment_transactions ============
CREATE POLICY "Service role update transactions" ON public.payment_transactions FOR UPDATE USING (true) WITH CHECK (true);

-- ============ products ============
CREATE POLICY "Admins insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ============ profiles ============
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ site_settings ============
CREATE POLICY "Admins insert settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ store_product_pricing ============
CREATE POLICY "Owners insert own pricing" ON public.store_product_pricing FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own pricing" ON public.store_product_pricing FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own pricing" ON public.store_product_pricing FOR DELETE USING (auth.uid() = user_id);

-- ============ stores ============
CREATE POLICY "Users insert own store" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own store" ON public.stores FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ user_roles ============
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ============ wallet_transactions ============
CREATE POLICY "Service role insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

-- ============ wallets ============
CREATE POLICY "Users insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all wallets" ON public.wallets FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ withdrawal_requests ============
CREATE POLICY "Users update own withdrawals" ON public.withdrawal_requests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update all withdrawals" ON public.withdrawal_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
