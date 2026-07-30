'use client';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession } from '../../../lib/api';
import { AnalyticsDashboard } from '../../../components/analytics/AnalyticsDashboard';

export default function PartidoAnalyticsPage() {
  const { token, me, loading, error } = useSession();

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  return (
    <PartidoShell me={me}>
      <AnalyticsDashboard token={token} showPartyControls={false} />
    </PartidoShell>
  );
}
