import type { ReactNode } from 'react';
import { AuthBranding } from './AuthBranding';

type AuthShellProps = {
  cardClassName?: string;
  children: ReactNode;
};

export function AuthShell({ cardClassName = '', children }: AuthShellProps) {
  return (
    <div className="velar-auth-shell min-h-[100dvh] w-full overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-full max-w-[1440px] flex-col gap-4 lg:grid lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:items-center lg:gap-8">
        <AuthBranding compact />
        <AuthBranding />

        <section className="flex w-full min-w-0 items-center justify-center lg:px-2 xl:px-4">
          <div
            className={`velar-auth-card w-full max-w-[560px] rounded-[20px] px-5 py-6 sm:px-7 sm:py-8 md:px-8 md:py-9 lg:px-8 lg:py-8 xl:px-10 xl:py-9 ${cardClassName}`}
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
