'use client';
import type { AnalyticsQuery } from '@velar/types';
import { BondStatus, COUNTRY_CODES, TransferStatus } from '@velar/types';

const STATUS_OPTIONS = [...new Set([...Object.values(BondStatus), ...Object.values(TransferStatus)])];

export function FilterBar({
  query,
  onChange,
  showCountry = true,
  showParty = false,
  partyOptions = [],
}: {
  query: AnalyticsQuery;
  onChange: (q: AnalyticsQuery) => void;
  showCountry?: boolean;
  showParty?: boolean;
  partyOptions?: { id: string; name: string }[];
}) {
  const update = (patch: Partial<AnalyticsQuery>) => onChange({ ...query, ...patch });
  const inputClass = 'rounded-lg border border-outline-variant/40 bg-surface px-2.5 py-1.5 text-sm text-on-surface';
  const labelClass = 'flex flex-col gap-1 text-xs font-medium text-on-surface-variant';

  return (
    <div className="glass-card mb-6 flex flex-wrap items-end gap-4 rounded-2xl p-4">
      <label className={labelClass}>
        Desde
        <input
          type="date"
          value={query.from?.slice(0, 10) ?? ''}
          onChange={(e) => update({ from: e.target.value || null })}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Hasta
        <input
          type="date"
          value={query.to?.slice(0, 10) ?? ''}
          onChange={(e) => update({ to: e.target.value || null })}
          className={inputClass}
        />
      </label>

      {showCountry && (
        <label className={labelClass}>
          País
          <select
            value={query.country ?? ''}
            onChange={(e) => update({ country: (e.target.value || null) as AnalyticsQuery['country'] })}
            className={inputClass}
          >
            <option value="">Todos</option>
            {COUNTRY_CODES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      )}

      {showParty && (
        <label className={labelClass}>
          Partido
          <select value={query.partyId ?? ''} onChange={(e) => update({ partyId: e.target.value || null })} className={inputClass}>
            <option value="">Todos</option>
            {partyOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      )}

      <label className={labelClass}>
        Estado
        <select
          value={query.status ?? ''}
          onChange={(e) => update({ status: (e.target.value || null) as AnalyticsQuery['status'] })}
          className={inputClass}
        >
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Agrupar por
        <select
          value={query.bucket ?? 'day'}
          onChange={(e) => update({ bucket: e.target.value as AnalyticsQuery['bucket'] })}
          className={inputClass}
        >
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </select>
      </label>

      <button type="button" onClick={() => onChange({})} className="ml-auto text-xs font-semibold text-primary hover:underline">
        Limpiar filtros
      </button>
    </div>
  );
}
