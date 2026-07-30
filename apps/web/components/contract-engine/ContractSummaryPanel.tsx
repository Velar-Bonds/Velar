'use client';

import { CalendarClock } from 'lucide-react';
import type { ContractSummary } from '@velar/types';
import { Alert, Badge, Card, CardHeader, CardTitle, Cluster, Stack } from '../ui';
import { attentionSeverityTone, formatContractAmount, statusLabel, statusTone } from '../../lib/contract-engine';

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No disponible';

const ROLE_LABEL: Record<string, string> = { tse: 'TSE', vendedor: 'Vendedor', comprador: 'Comprador' };

/**
 * Structured contract summary (issue #38): status, amount, obligations per
 * role, key dates and attention/risk flags. Complements — never replaces —
 * the legal document (see `ContractDocumentPreview`).
 */
export function ContractSummaryPanel({ summary }: { summary: ContractSummary }) {
  return (
    <Stack gap={4}>
      <Cluster justify="between" gap={3}>
        <div>
          <h3 className="text-base font-semibold text-on-surface">{summary.title}</h3>
          <p className="mono-data text-xs text-on-surface-variant">
            {summary.contractId} · {summary.version}
          </p>
        </div>
        <Badge tone={statusTone(summary.status)}>{statusLabel(summary.status)}</Badge>
      </Cluster>

      {summary.attentionFlags.length > 0 && (
        <Stack gap={2}>
          {summary.attentionFlags.map((flag) => (
            <Alert key={flag.id} tone={attentionSeverityTone(flag.severity)} title={flagTitle(flag.kind)}>
              {flag.message}
            </Alert>
          ))}
        </Stack>
      )}

      <Card padding="md">
        <CardHeader>
          <CardTitle>Monto</CardTitle>
        </CardHeader>
        <p className="text-lg font-semibold text-on-surface">
          {formatContractAmount(summary.amount, summary.country)}
        </p>
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Obligaciones por parte</CardTitle>
        </CardHeader>
        {summary.obligations.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No hay obligaciones derivadas todavía.</p>
        ) : (
          <Stack gap={2}>
            {summary.obligations.map((obligation) => (
              <Cluster key={obligation.id} gap={2} align="start">
                <Badge tone="neutral">{ROLE_LABEL[obligation.role] ?? obligation.role}</Badge>
                <p className="text-sm text-on-surface-variant">{obligation.description}</p>
              </Cluster>
            ))}
          </Stack>
        )}
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Condiciones</CardTitle>
        </CardHeader>
        {summary.conditions.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No hay condiciones derivadas todavía.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
            {summary.conditions.map((condition) => (
              <li key={condition.id}>{condition.description}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <CalendarClock size={16} aria-hidden /> Fechas clave
          </CardTitle>
        </CardHeader>
        <Stack gap={2}>
          {summary.keyDates.map((date) => (
            <Cluster key={date.id} justify="between">
              <span className="text-sm text-on-surface-variant">{date.label}</span>
              <span className={`mono-data text-sm ${date.unknown ? 'italic text-on-surface-variant/70' : 'text-on-surface'}`}>
                {fmtDate(date.date)}
              </span>
            </Cluster>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

function flagTitle(kind: string): string {
  const labels: Record<string, string> = {
    frozen: 'Bono congelado',
    approaching_maturity: 'Vencimiento próximo',
    maturity_passed: 'Vencimiento superado',
    stalled_escrow: 'Escrow estancado',
    amount_mismatch: 'Monto inconsistente',
    missing_key_dates: 'Faltan fechas clave',
  };
  return labels[kind] ?? kind;
}

export default ContractSummaryPanel;
