-- VELAR: notificaciones in-app por eventos del ciclo de vida (ofertas, pagos, bonos).

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- El usuario solo ve y modifica sus propias notificaciones.
DROP POLICY IF EXISTS notifications_owner ON notifications;
CREATE POLICY notifications_owner ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
