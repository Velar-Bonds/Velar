'use client';

import type { ReactNode } from 'react';
import type { ContractVersionDiff } from '@velar/types';
import { Badge, Stack } from '../ui';
import { buildDiffSummary } from '../../lib/contract-engine';

/** Visual, structured diff between two contract versions (issue #38). */
export function ContractVersionDiffView({ diff }: { diff: ContractVersionDiff }) {
  return (
    <Stack gap={3}>
      <p className="text-sm font-medium text-on-surface">{buildDiffSummary(diff)}</p>

      {diff.added.length > 0 && (
        <DiffGroup tone="success" label="Agregadas">
          {diff.added.map((c) => (
            <li key={c.clauseKey}>{c.title}</li>
          ))}
        </DiffGroup>
      )}
      {diff.removed.length > 0 && (
        <DiffGroup tone="error" label="Eliminadas">
          {diff.removed.map((c) => (
            <li key={c.clauseKey}>{c.title}</li>
          ))}
        </DiffGroup>
      )}
      {diff.changed.length > 0 && (
        <DiffGroup tone="warning" label="Modificadas">
          {diff.changed.map((c) => (
            <li key={c.clauseKey}>
              {c.title}
              {c.bodyChanged ? ' — texto cambiado' : ''}
              {c.fromOrder !== c.toOrder ? ` — orden ${c.fromOrder + 1} → ${c.toOrder + 1}` : ''}
            </li>
          ))}
        </DiffGroup>
      )}
      {diff.unchanged.length > 0 && (
        <DiffGroup tone="neutral" label={`Sin cambios (${diff.unchanged.length})`}>
          {diff.unchanged.map((c) => (
            <li key={c.clauseKey}>{c.title}</li>
          ))}
        </DiffGroup>
      )}
    </Stack>
  );
}

function DiffGroup({
  tone,
  label,
  children,
}: {
  tone: 'success' | 'error' | 'warning' | 'neutral';
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Badge tone={tone} className="mb-1.5">
        {label}
      </Badge>
      <ul className="list-disc space-y-0.5 pl-6 text-sm text-on-surface-variant">{children}</ul>
    </div>
  );
}

export default ContractVersionDiffView;
