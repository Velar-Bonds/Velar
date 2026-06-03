'use client';
import { ReactNode } from 'react';

export function SocialButtons() {
  const btn = 'flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-slate-50';
  return (
    <div className="space-y-3">
      <button type="button" className={btn}>
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.9-9.9 6.9-17.4Z" /><path fill="#FBBC05" d="M10.4 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z" /><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-3.7-13.6-9.4l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" /></svg>
        <span className="flex-1 text-center">Continuar con Google</span>
      </button>
      <button type="button" className={btn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M18.9 1.2h3.7l-8 9.1L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3h-2.2l13.3 17.3Z" /></svg>
        <span className="flex-1 text-center">Continuar con X</span>
      </button>
      <button type="button" className={btn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3v10ZM6.5 7.7a1.8 1.8 0 1 1 0-3.5 1.8 1.8 0 0 1 0 3.5ZM19 19h-3v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.3c.4-.6 1.2-1.5 2.9-1.5 2.1 0 3.4 1.4 3.4 4.3V19Z" /></svg>
        <span className="flex-1 text-center">Continuar con LinkedIn</span>
      </button>
    </div>
  );
}

export function Divider({ text }: { text: string }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs text-slate-400">{text}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export function Field({
  label, icon, children,
}: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#1E293B]">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        {children}
      </div>
    </label>
  );
}

export const MailIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
export const LockIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
export const UserIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#1E293B] placeholder:text-slate-400 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';
