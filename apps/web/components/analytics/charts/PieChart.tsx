'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { colorVar } from '../../ui/tokens';
import { ChartFrame, ChartTableFallback, chartTooltipStyle } from './ChartFrame';
import type { BarDatum } from './BarChart';

const PALETTE = ['primary', 'primaryContainer', 'tertiary', 'secondary', 'success', 'warning'] as const;

export function AnalyticsPieChart({
  title,
  description,
  data,
  valueLabel = 'Valor',
  onSliceClick,
}: {
  title: string;
  description?: string;
  data: BarDatum[];
  valueLabel?: string;
  onSliceClick?: (d: BarDatum) => void;
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
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                cursor={onSliceClick ? 'pointer' : undefined}
                onClick={(_, index) => onSliceClick?.(data[index])}
              >
                {data.map((d, i) => (
                  <Cell key={d.key} fill={colorVar(PALETTE[i % PALETTE.length])} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v.toLocaleString('es-CR'), valueLabel]} {...chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
