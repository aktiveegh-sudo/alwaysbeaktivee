DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.store_analytics CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Empty and remove storage bucket via storage admin functions
DO $$
BEGIN
  PERFORM storage.empty_bucket('product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM storage.delete_bucket('product-images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DELETE FROM auth.identities;
DELETE FROM auth.users;