'use client';

import { useEffect, useState } from 'react';
import type { AssembledContractDocument, ContractSummary, ContractVersionDiff, ContractVersionSummary } from '@velar/types';
import { Alert, EmptyState, Spinner, Tabs } from '../ui';
import { createContractEngineClient, type FetchLike } from '../../lib/contract-engine';
import { ContractSummaryPanel } from './ContractSummaryPanel';
import { ContractDocumentPreview } from './ContractDocumentPreview';
import { ContractVersionBrowser } from './ContractVersionBrowser';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface ContractEngineExplorerProps {
  /** `token_id` or human-readable `bond_id` of the bond. */
  bondId: string;
  /** Bearer token for the authenticated reads. */
  token: string;
  /** Preloaded summary (fixtures/SSR); when present the initial fetch is skipped. */
  initialSummary?: ContractSummary;
}

/**
 * Contract management explorer (issue #38): structured summary, assembled
 * document preview, and version browsing + visual diff. Complements — never
 * replaces — the legal document. See `ContractReader` (#39) for the plain-
 * language reading experience.
 */
export function ContractEngineExplorer({ bondId, token, initialSummary }: ContractEngineExplorerProps) {
  const [summary, setSummary] = useState<ContractSummary | null>(initialSummary ?? null);
  const [summaryLoading, setSummaryLoading] = useState(!initialSummary);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [assembledDocument, setAssembledDocument] = useState<AssembledContractDocument | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [versions, setVersions] = useState<ContractVersionSummary[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  const [diff, setDiff] = useState<ContractVersionDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const authFetch: FetchLike = (url, init) =>
    fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
  const client = createContractEngineClient({ baseUrl: API_BASE, fetch: authFetch });

  useEffect(() => {
    if (initialSummary) return;
    let active = true;
    setSummaryLoading(true);
    setSummaryError(null);
    client
      .getSummary(bondId)
      .then((res) => active && setSummary(res))
      .catch((e: unknown) => active && setSummaryError(e instanceof Error ? e.message : 'No se pudo cargar el resumen'))
      .finally(() => active && setSummaryLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bondId]);

  useEffect(() => {
    if (!summary) return;
    let active = true;
    setDocumentLoading(true);
    setDocumentError(null);
    client
      .getDocument(summary.bondId)
      .then((res) => active && setAssembledDocument(res))
      .catch((e: unknown) => active && setDocumentError(e instanceof Error ? e.message : 'No se pudo ensamblar el documento'))
      .finally(() => active && setDocumentLoading(false));

    setVersionsLoading(true);
    setVersionsError(null);
    client
      .listTemplates(summary.country)
      .then((templates) => {
        const template = templates[0];
        if (!template) throw new Error('No hay una plantilla de contrato configurada para este país.');
        return client.listVersions(template.id);
      })
      .then((res) => active && setVersions(res))
      .catch((e: unknown) => active && setVersionsError(e instanceof Error ? e.message : 'No se pudieron cargar las versiones'))
      .finally(() => active && setVersionsLoading(false));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.bondId, summary?.country]);

  async function handleCompare(fromId: string, toId: string) {
    setDiffLoading(true);
    setDiffError(null);
    try {
      setDiff(await client.diffVersions(fromId, toId));
    } catch (e: unknown) {
      setDiffError(e instanceof Error ? e.message : 'No se pudo calcular la diferencia');
    } finally {
      setDiffLoading(false);
    }
  }

  if (summaryLoading) {
    return (
      <div className="flex items-center gap-3 py-12 text-on-surface-variant">
        <Spinner /> Derivando el resumen del contrato…
      </div>
    );
  }
  if (summaryError) return <Alert tone="error">{summaryError}</Alert>;
  if (!summary) return <EmptyState title="Sin contrato" description="No se encontró un contrato estructurado para este bono." />;

  return (
    <Tabs
      items={[
        { id: 'resumen', label: 'Resumen', content: <ContractSummaryPanel summary={summary} /> },
        {
          id: 'documento',
          label: 'Documento',
          content: <ContractDocumentPreview document={assembledDocument} loading={documentLoading} error={documentError} />,
        },
        {
          id: 'versiones',
          label: 'Versiones',
          content: (
            <ContractVersionBrowser
              versions={versions}
              loading={versionsLoading}
              error={versionsError}
              onCompare={handleCompare}
              diff={diff}
              diffLoading={diffLoading}
              diffError={diffError}
            />
          ),
        },
      ]}
    />
  );
}

export default ContractEngineExplorer;
