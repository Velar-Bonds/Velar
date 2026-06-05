import type { ReactNode } from 'react';
import { AuthBranding } from './AuthBranding';

type AuthShellProps = {
  cardClassName?: string;
  children: ReactNode;
};

export function AuthShell({ cardClassName = '', children }: AuthShellProps) {
  return (
    <div className="velar-auth-shell min-h-[100dvh] w-full overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:h-[100dvh] lg:overflow-hidden lg:px-5 lg:py-4">
      <div className="mx-auto flex min-h-full max-w-[1520px] flex-col gap-4 lg:h-full lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        <AuthBranding compact />
        <AuthBranding />

        <section className="flex w-full min-w-0 items-center justify-center lg:w-[46%] lg:min-w-[420px] lg:px-2 xl:w-[44%] xl:px-4 2xl:w-[42%]">
          <div
            className={`velar-auth-card w-full rounded-[24px] px-5 py-6 sm:px-7 sm:py-8 md:px-8 md:py-9 lg:flex lg:max-h-full lg:min-h-0 lg:px-8 lg:py-8 xl:px-10 xl:py-9 ${cardClassName}`}
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
