'use client';
import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import type { AnalyticsQuery } from '@velar/types';
import { downloadCsv, downloadPdf } from '../../lib/analytics/client';

export function ExportButtons({ token, query }: { token: string; query: AnalyticsQuery }) {
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const run = async (format: 'csv' | 'pdf') => {
    setBusy(format);
    setError('');
    try {
      if (format === 'csv') await downloadCsv(token, query, `velar-analytics-${today}.csv`);
      else await downloadPdf(token, query, `velar-analytics-${today}.pdf`);
    } catch (e: any) {
      setError(e.message ?? 'No se pudo exportar');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run('csv')}
          disabled={busy !== null}
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          <Download size={16} />
          {busy === 'csv' ? 'Exportando…' : 'CSV'}
        </button>
        <button
          type="button"
          onClick={() => run('pdf')}
          disabled={busy !== null}
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          <FileText size={16} />
          {busy === 'pdf' ? 'Exportando…' : 'PDF'}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
