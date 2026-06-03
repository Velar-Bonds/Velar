-- ============================================================
-- VELAR — Fix recursión en RLS de profiles
-- ============================================================
-- Problema: la policy "profiles_tse_admin" hacía SELECT sobre profiles
-- DENTRO de una policy aplicada a profiles → "infinite recursion detected
-- in policy for relation profiles" cuando el frontend consulta Supabase
-- directamente (el backend usa service_role y no lo notaba).
--
-- Fix: función SECURITY DEFINER que lee el rol del usuario actual SIN
-- disparar RLS, y reescribir las policies de profiles para usarla.
-- ============================================================

-- Helper: rol del usuario autenticado (bypassa RLS por SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Reescribir la policy recursiva sobre profiles.
DROP POLICY IF EXISTS "profiles_tse_admin" ON profiles;
CREATE POLICY "profiles_tse_admin" ON profiles
  FOR SELECT USING (public.auth_role() IN ('tse', 'admin'));

-- (Opcional, consistencia) Las demás policies que consultan profiles están
-- sobre OTRAS tablas (bonds, transfers, audit_events) y NO causan recursión,
-- por lo que se dejan como están. Si se quisiera, podrían migrarse a auth_role()
-- para simplificar, pero no es necesario para corregir el bug.
