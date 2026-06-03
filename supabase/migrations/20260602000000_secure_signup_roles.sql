-- ============================================================
-- VELAR — Seguridad de roles en signup
-- ============================================================
-- Problema: handle_new_user() copiaba el rol enviado por el cliente en
-- raw_user_meta_data, permitiendo que un usuario se registrara como
-- admin / tse / validador.
--
-- Fix: en el signup solo se permiten roles NO privilegiados
-- (comprador, recomprador, emisor). Cualquier otro valor cae a 'comprador'.
-- Los roles privilegiados (tse, admin, validador) se asignan únicamente por
-- un admin vía PATCH /api/users/:id/role.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested_role text;
  safe_role      user_role;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IN ('comprador', 'recomprador', 'emisor') THEN
    safe_role := requested_role::user_role;
  ELSE
    safe_role := 'comprador';  -- default seguro: bloquea tse/admin/validador
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    safe_role
  );
  RETURN NEW;
END;
$$;
