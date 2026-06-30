'use client';
import { ReactNode } from 'react';

export function AuthField({
  label, icon, children,
}: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-medium text-[#32415f]">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b96ad]">{icon}</span>}
        {children}
      </div>
    </label>
  );
}

export { AuthField as Field };
