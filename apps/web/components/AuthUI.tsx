'use client';

import { Apple, Lock, Mail, User } from 'lucide-react';

export function SocialButtons() {
  const btn = 'velar-social-button';
  return (
    <div className="velar-social-grid">
      <button type="button" className={btn}>
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.9-9.9 6.9-17.4Z" /><path fill="#FBBC05" d="M10.4 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z" /><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-3.7-13.6-9.4l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" /></svg>
        <span>Google</span>
      </button>
      <button type="button" className={btn}>
        <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden>
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
        <span>Microsoft</span>
      </button>
      <button type="button" className={btn}>
        <Apple size={21} fill="currentColor" strokeWidth={1.8} aria-hidden />
        <span>Apple</span>
      </button>
    </div>
  );
}

export const MailIcon = <Mail size={19} strokeWidth={1.9} aria-hidden />;
export const LockIcon = <Lock size={19} strokeWidth={1.9} aria-hidden />;
export const UserIcon = <User size={19} strokeWidth={1.9} aria-hidden />;

export const inputClass =
  'velar-input h-12 w-full rounded-[8px] border bg-white py-3 pl-12 pr-4 text-[15px] placeholder:text-[#7c879d] outline-none transition';
