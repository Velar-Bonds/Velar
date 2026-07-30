'use client';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colorVar } from '../../ui/tokens';
import { ChartFrame, ChartTableFallback, chartTooltipStyle } from './ChartFrame';

export interface SeriesPoint {
  bucketStart: string;
  value: number;
}

export function AnalyticsLineChart({
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
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colorVar('outlineVariant')} />
              <XAxis dataKey="bucketStart" tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <YAxis tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('es-CR'), valueLabel]} {...chartTooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={colorVar('primary')} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
