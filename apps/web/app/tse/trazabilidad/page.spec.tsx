import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn(() => null) }),
  usePathname: () => '/tse/trazabilidad',
}));

// Mock supabase client
vi.mock('../../../lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }),
      signOut: vi.fn(),
    },
  }),
}));

// Mock role guard
vi.mock('../../../lib/role-guard', () => ({
  useRoleGuard: () => true,
}));

// Track apiFetch calls
const apiFetchCalls: Array<{ method: string; path: string }> = [];
const mockApiFetch = vi.fn(async (token: string, method: string, path: string) => {
  apiFetchCalls.push({ method, path });
  if (path === '/bonds/summary') {
    return [
      { id: 'bond-1', name: 'SOL-2026-001', value: 1000000, status: 'activo' },
      { id: 'bond-2', name: 'SOL-2026-002', value: 500000, status: 'emitido' },
    ];
  }
  if (path.startsWith('/audit/bonds/')) {
    return {
      bond: { tokenId: 'bond-1', bondId: 'SOL-2026-001' },
      events: [],
      transfers: [],
      owners: [
        { ownerId: 'party-1', name: 'Partido Aurora', since: '2026-01-15T10:00:00Z', until: null, paid: false, current: true },
      ],
    };
  }
  return [];
});

vi.mock('../../../lib/api', () => ({
  useSession: () => ({
    token: 'mock-token',
    me: { id: 'mock', email: 'tse@test.com', role: 'tse' },
    loading: false,
    error: null,
  }),
  apiFetch: (token: string, method: string, path: string) => mockApiFetch(token, method, path),
}));

// Mock all lucide-react icons as simple spans
vi.mock('lucide-react', () => {
  const icon = () => <span data-testid="icon" />;
  return {
    // TSEShell icons
    LayoutGrid: icon, ClipboardCheck: icon, Send: icon, ScrollText: icon,
    Waypoints: icon, Search: icon, Settings: icon, LogOut: icon,
    ShieldCheck: icon, BarChart3: icon, FileText: icon, Shield: icon,
    // NotificationBell
    Bell: icon, CheckCheck: icon,
    // Toast
    CheckCircle: icon, AlertTriangle: icon, Info: icon, X: icon,
    // Page icons
    ArrowRight: icon, ExternalLink: icon, User: icon, Clock: icon,
  };
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="next-link">{children}</a>
  ),
}));

import TrazabilidadPage from './page';

describe('TSE Trazabilidad Page', () => {
  beforeEach(() => {
    apiFetchCalls.length = 0;
    vi.clearAllMocks();
  });

  it('renders the page and fetches bond summary for sidebar', async () => {
    render(<TrazabilidadPage />);

    // Wait for the page to render after loading
    await waitFor(() => {
      expect(screen.getByText('Trazabilidad completa')).toBeInTheDocument();
    });

    // Assert /bonds/summary was called
    await waitFor(() => {
      const summaryCalls = apiFetchCalls.filter((c) => c.path === '/bonds/summary');
      expect(summaryCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fetches traceability when a bond is selected', async () => {
    const user = userEvent.setup();
    render(<TrazabilidadPage />);

    // Wait for sidebar bonds to render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /SOL-2026-001/ })).toBeInTheDocument();
    });

    // Click the first bond in sidebar
    await user.click(screen.getByRole('button', { name: /SOL-2026-001/ }));

    // Assert /audit/bonds/:id/traceability was called
    await waitFor(() => {
      const traceCalls = apiFetchCalls.filter((c) =>
        c.path.startsWith('/audit/bonds/') && c.path.endsWith('/traceability')
      );
      expect(traceCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('does NOT call the /transfers endpoint', async () => {
    render(<TrazabilidadPage />);

    // Wait for the page to fully render
    await waitFor(() => {
      expect(screen.getByText('Trazabilidad completa')).toBeInTheDocument();
    });

    // Give any pending effects time to fire
    await new Promise((r) => setTimeout(r, 100));

    // Assert NO calls to /transfers
    const transferCalls = apiFetchCalls.filter((c) => c.path.includes('/transfers'));
    expect(transferCalls.length).toBe(0);
  });
});
