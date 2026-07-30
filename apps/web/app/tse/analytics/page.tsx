'use client';
import { TSEShell } from '../../../components/TSEShell';
import { useSession } from '../../../lib/api';
import { AnalyticsDashboard } from '../../../components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  const { token, me, loading, error } = useSession();

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  return (
    <TSEShell me={me}>
      <AnalyticsDashboard token={token} showPartyControls />
    </TSEShell>
  );
}
