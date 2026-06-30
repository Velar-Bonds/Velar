'use client';
import { ReactNode } from 'react';

export function AuthField({
  label, icon, children,
}: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-medium text-[#dbe6fb]">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9fb2d4]">{icon}</span>}
        {children}
      </div>
    </label>
  );
}

export { AuthField as Field };
