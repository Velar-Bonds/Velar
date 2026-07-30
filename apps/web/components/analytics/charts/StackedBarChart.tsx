'use client';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { colorVar } from '../../ui/tokens';
import { ChartFrame, ChartTableFallback, chartTooltipStyle } from './ChartFrame';

export interface StackedSegmentDef {
  key: string;
  label: string;
  color: Parameters<typeof colorVar>[0];
}

export interface StackedDatum {
  label: string;
  [segmentKey: string]: string | number;
}

export function AnalyticsStackedBarChart({
  title,
  description,
  data,
  segments,
}: {
  title: string;
  description?: string;
  data: StackedDatum[];
  segments: StackedSegmentDef[];
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
            ...segments.map((s) => ({ key: s.key, label: s.label, render: (d: StackedDatum) => String(d[s.key] ?? 0) })),
          ]}
        />
      }
    >
      <div style={{ width: '100%', height: 280 }}>
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-on-surface-variant">Sin datos todavía.</p>
        ) : (
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colorVar('outlineVariant')} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <YAxis tick={{ fontSize: 11 }} stroke={colorVar('onSurfaceVariant')} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {segments.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId="stack"
                  fill={colorVar(s.color)}
                  radius={i === segments.length - 1 ? [4, 4, 0, 0] : undefined}
                  activeBar={{ fill: colorVar(s.color), fillOpacity: 0.75, stroke: colorVar('onSurface'), strokeOpacity: 0.3 }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
