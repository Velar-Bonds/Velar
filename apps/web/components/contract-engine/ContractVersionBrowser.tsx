'use client';

import { useState } from 'react';
import type { ContractVersionDiff, ContractVersionSummary } from '@velar/types';
import { Alert, Badge, Button, Cluster, EmptyState, Select, Spinner, Stack } from '../ui';
import { ContractVersionDiffView } from './ContractVersionDiffView';

const VERSION_STATUS_TONE: Record<ContractVersionSummary['status'], 'neutral' | 'primary' | 'success'> = {
  draft: 'neutral',
  published: 'success',
  archived: 'neutral',
};

const VERSION_STATUS_LABEL: Record<ContractVersionSummary['status'], string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};

export interface ContractVersionBrowserProps {
  versions: ContractVersionSummary[];
  loading: boolean;
  error: string | null;
  onCompare: (fromId: string, toId: string) => void;
  diff: ContractVersionDiff | null;
  diffLoading: boolean;
  diffError: string | null;
}

/** Browse a template's versions and compare any two with a structured diff (issue #38). */
export function ContractVersionBrowser({
  versions,
  loading,
  error,
  onCompare,
  diff,
  diffLoading,
  diffError,
}: ContractVersionBrowserProps) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-on-surface-variant">
        <Spinner /> Cargando versiones…
      </div>
    );
  }
  if (error) return <Alert tone="error">{error}</Alert>;
  if (versions.length === 0) {
    return <EmptyState title="Sin versiones" description="Todavía no hay versiones de la plantilla de contrato." />;
  }

  return (
    <Stack gap={4}>
      <ul className="space-y-1.5">
        {versions.map((v) => (
          <li key={v.id}>
            <Cluster justify="between" gap={2}>
              <span className="mono-data text-sm text-on-surface">v{v.versionNumber}</span>
              <Badge tone={VERSION_STATUS_TONE[v.status]}>{VERSION_STATUS_LABEL[v.status]}</Badge>
            </Cluster>
          </li>
        ))}
      </ul>

      {versions.length >= 2 && (
        <Cluster gap={3} align="end">
          <Select aria-label="Versión origen" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">Desde…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </Select>
          <Select aria-label="Versión destino" value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">Hasta…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </Select>
          <Button size="sm" disabled={!fromId || !toId} onClick={() => onCompare(fromId, toId)}>
            Comparar
          </Button>
        </Cluster>
      )}

      {diffLoading && (
        <div className="flex items-center gap-3 py-4 text-on-surface-variant">
          <Spinner /> Calculando diferencias…
        </div>
      )}
      {diffError && <Alert tone="error">{diffError}</Alert>}
      {diff && !diffLoading && <ContractVersionDiffView diff={diff} />}
    </Stack>
  );
}

export default ContractVersionBrowser;
