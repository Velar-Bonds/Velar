-- VELAR: Almacenamiento de certificados PDF de bonos + auditoría de documentos.

-- ── Agregar evento de auditoría ────────────────────────────────────────────
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'documento_subido';

-- ── Bucket bond-documents (privado) ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bond-documents',
  'bond-documents',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS en storage.objects ─────────────────────────────────────────────────
-- Solo el TSE puede subir certificados.
DROP POLICY IF EXISTS "tse_can_upload_bond_document" ON storage.objects;
CREATE POLICY "tse_can_upload_bond_document"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bond-documents'
    AND public.auth_role() IN ('tse', 'admin')
  );

-- Solo el TSE/admin o el dueño actual del bono puede descargar.
DROP POLICY IF EXISTS "owner_can_download_bond_document" ON storage.objects;
CREATE POLICY "owner_can_download_bond_document"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bond-documents'
    AND (
      public.auth_role() IN ('tse', 'admin')
      OR EXISTS (
        SELECT 1 FROM public.bonds b
        WHERE b.token_id::text = split_part(storage.objects.name, '/', 1)
          AND b.current_owner = auth.uid()
      )
    )
  );

-- TSE puede reemplazar (UPDATE) el certificado.
DROP POLICY IF EXISTS "tse_can_update_bond_document" ON storage.objects;
CREATE POLICY "tse_can_update_bond_document"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'bond-documents'
    AND public.auth_role() IN ('tse', 'admin')
  );
