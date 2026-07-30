'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colorVar } from '../../ui/tokens';
import { ChartFrame, ChartTableFallback, chartTooltipStyle } from './ChartFrame';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
}

export function AnalyticsBarChart({
  title,
  description,
  data,
  valueLabel = 'Valor',
  onBarClick,
}: {
  title: string;
  description?: string;
  data: BarDatum[];
  valueLabel?: string;
  onBarClick?: (d: BarDatum) => void;
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
            { key: 'label', label: 'Categoría', render: (d) => d.label },
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
            <BarChart
              data={data}
              onClick={(state: any) => {
                const idx = state?.activeTooltipIndex;
                if (idx != null && onBarClick) onBarClick(data[idx]);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colorVar('outlineVariant')} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <YAxis tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('es-CR'), valueLabel]} {...chartTooltipStyle} />
              <Bar
                dataKey="value"
                fill={colorVar('primary')}
                radius={[4, 4, 0, 0]}
                cursor={onBarClick ? 'pointer' : undefined}
                activeBar={{ fill: colorVar('primaryHover'), stroke: colorVar('primaryHover') }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
