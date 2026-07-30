'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colorVar } from '../../ui/tokens';
import { ChartFrame, ChartTableFallback, chartTooltipStyle } from './ChartFrame';
import type { SeriesPoint } from './LineChart';

export function AnalyticsAreaChart({
  title,
  description,
  data,
  valueLabel = 'Valor',
}: {
  title: string;
  description?: string;
  data: SeriesPoint[];
  valueLabel?: string;
}) {
  return (
    <ChartFrame
      title={title}
      description={description}
      table={
        <ChartTableFallback
          rows={data}
          caption={title}
          columns={[
            { key: 'bucketStart', label: 'Período', render: (d) => d.bucketStart },
            { key: 'value', label: valueLabel, render: (d) => String(d.value) },
          ]}
        />
      }
    >
      <div style={{ width: '100%', height: 260 }}>
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-on-surface-variant">Sin datos todavía.</p>
        ) : (
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="analyticsAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorVar('primaryContainer')} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={colorVar('primaryContainer')} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colorVar('outlineVariant')} />
              <XAxis dataKey="bucketStart" tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <YAxis tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('es-CR'), valueLabel]} {...chartTooltipStyle} />
              <Area type="monotone" dataKey="value" stroke={colorVar('primary')} strokeWidth={2} fill="url(#analyticsAreaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
