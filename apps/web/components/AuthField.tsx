'use client';
import { ReactNode } from 'react';

export function Field({
  label, icon, children,
}: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#10235d]">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b9ac0]">{icon}</span>}
        {children}
      </div>
    </label>
  );
}
