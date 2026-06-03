-- ============================================================
-- VELAR — Campos de registro (perspectivas TSE / Partido / Usuario)
-- ============================================================
-- Info completa que se captura al registrarse:
--  - USUARIO (comprador/recomprador): nombres, apellidos, identificación, teléfono, dirección.
--  - PARTIDO: representante legal, cédula jurídica (+ nombre y código en la tabla parties).
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nombres        text,
  ADD COLUMN IF NOT EXISTS apellidos      text,
  ADD COLUMN IF NOT EXISTS identificacion text,
  ADD COLUMN IF NOT EXISTS telefono       text,
  ADD COLUMN IF NOT EXISTS direccion      text;

ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS representante_legal text,
  ADD COLUMN IF NOT EXISTS cedula_juridica     text;
