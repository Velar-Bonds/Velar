'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '../../components/AuthShell';
import { LoginForm, SignUpForm } from '../../components/AuthForms';

type AuthMode = 'login' | 'signup';

function getMode(rawMode: string | null): AuthMode {
  return rawMode === 'signup' ? 'signup' : 'login';
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = getMode(searchParams.get('mode'));

  function handleModeChange(nextMode: AuthMode) {
    if (nextMode === mode) return;

    const query = new URLSearchParams(searchParams.toString());
    if (nextMode === 'signup') {
      query.set('mode', 'signup');
    } else {
      query.delete('mode');
    }
    const queryString = query.toString();
    router.replace(queryString ? `/login?${queryString}` : '/login', { scroll: false });
  }

  return (
    <AuthShell mode={mode} onModeChange={handleModeChange}>
      {mode === 'login' ? (
        <LoginForm onSwitchToSignUp={() => handleModeChange('signup')} />
      ) : (
        <SignUpForm onSwitchToLogin={() => handleModeChange('login')} />
      )}
    </AuthShell>
  );
}
