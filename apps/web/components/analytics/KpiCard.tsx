import type { LucideIcon } from 'lucide-react';

export function KpiCard({
  label,
  value,
  Icon,
  color = 'text-primary',
  bg = 'bg-primary/10',
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="glass-card flex items-center gap-4 rounded-xl p-5 transition-transform hover:-translate-y-0.5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.1} />
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
