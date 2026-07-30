'use client';

import { Download, Printer } from 'lucide-react';
import type { AssembledContractDocument } from '@velar/types';
import { Alert, Badge, Button, Cluster, EmptyState, Spinner, Stack } from '../ui';
import { buildDocumentExportText } from '../../lib/contract-engine';

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ContractDocumentPreviewProps {
  document: AssembledContractDocument | null;
  loading: boolean;
  error: string | null;
}

/**
 * Preview of the document deterministically assembled from a template
 * version + bond data (issue #38). Missing parameters are shown inline —
 * never fabricated — exactly as the backend left them.
 */
export function ContractDocumentPreview({ document, loading, error }: ContractDocumentPreviewProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-on-surface-variant">
        <Spinner /> Ensamblando el documento…
      </div>
    );
  }
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!document) {
    return <EmptyState title="Sin documento" description="No se pudo ensamblar el documento para este bono." />;
  }

  const missingCount = document.sections.reduce((n, s) => n + s.missingParameters.length, 0);

  return (
    <Stack gap={4} className="print:space-y-3">
      <Cluster justify="between">
        <div>
          <h3 className="text-base font-semibold text-on-surface">{document.title}</h3>
          <p className="text-xs text-on-surface-variant">Versión {document.versionNumber}</p>
        </div>
        <Cluster gap={2} className="print:hidden">
          <Button variant="ghost" size="sm" leftIcon={<Printer size={14} />} onClick={() => window.print()}>
            Imprimir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => download(`contrato-${document.bondId}-v${document.versionNumber}.txt`, buildDocumentExportText(document))}
          >
            Exportar
          </Button>
        </Cluster>
      </Cluster>

      {missingCount > 0 && (
        <Alert tone="warning" title="Datos pendientes">
          {missingCount} dato(s) del documento no están disponibles todavía y se muestran marcados en el texto.
        </Alert>
      )}

      <Stack gap={4}>
        {document.sections.map((section) => (
          <div key={section.clauseKey}>
            <Cluster gap={2} align="center" className="mb-1">
              <h4 className="text-sm font-semibold text-on-surface">
                {section.order}. {section.title}
              </h4>
              {section.missingParameters.length > 0 && <Badge tone="warning">Incompleta</Badge>}
            </Cluster>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{section.text}</p>
          </div>
        ))}
      </Stack>
    </Stack>
  );
}

export default ContractDocumentPreview;
