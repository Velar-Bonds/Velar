-- VELAR: soporte de persistencia para el dashboard de analítica (issue #44).
-- Dos tablas nuevas, append/update-only en el sentido de que no se toca ninguna
-- migración existente (docs/AGENTS.md §3): vistas guardadas del dashboard
-- (por usuario) y reglas de alerta de umbral (configuración, TSE/admin).
-- Usa public.auth_role() (20260602000001_fix_profiles_rls_recursion.sql) para
-- evitar la recursión de RLS sobre `profiles` documentada en docs/AGENTS.md §5.

-- ── 1. Vistas guardadas del dashboard (por usuario) ────────────────────────
CREATE TABLE IF NOT EXISTS analytics_saved_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL,
  name       text NOT NULL,
  query      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_saved_views_owner ON analytics_saved_views(owner_id);

ALTER TABLE analytics_saved_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_saved_views_owner_rw ON analytics_saved_views;
CREATE POLICY analytics_saved_views_owner_rw ON analytics_saved_views
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── 2. Reglas de alerta de umbral (configuración, TSE/admin) ───────────────
CREATE TABLE IF NOT EXISTS analytics_alert_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  metric_path      text NOT NULL,
  comparator       text NOT NULL CHECK (comparator IN ('gt', 'lt', 'gte', 'lte')),
  threshold        numeric NOT NULL,
  scope            jsonb NOT NULL DEFAULT '{"kind":"all"}'::jsonb,
  notify_user_ids  uuid[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_alert_rules_tse_admin ON analytics_alert_rules;
CREATE POLICY analytics_alert_rules_tse_admin ON analytics_alert_rules
  FOR ALL TO authenticated
  USING (public.auth_role() IN ('tse', 'admin'))
  WITH CHECK (public.auth_role() IN ('tse', 'admin'));

-- ── 3. updated_at automático en ambas tablas ────────────────────────────────
-- Reutiliza set_updated_at() (definida en 20260601000000_initial_schema.sql).
DROP TRIGGER IF EXISTS trg_analytics_saved_views_updated_at ON analytics_saved_views;
CREATE TRIGGER trg_analytics_saved_views_updated_at
  BEFORE UPDATE ON analytics_saved_views
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_analytics_alert_rules_updated_at ON analytics_alert_rules;
CREATE TRIGGER trg_analytics_alert_rules_updated_at
  BEFORE UPDATE ON analytics_alert_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
