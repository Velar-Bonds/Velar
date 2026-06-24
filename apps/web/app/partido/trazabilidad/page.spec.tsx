import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/partido/trazabilidad',
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
    me: { id: 'mock', email: 'partido@test.com', role: 'emisor', party_id: 'party-1' },
    loading: false,
    error: null,
  }),
  apiFetch: (token: string, method: string, path: string) => mockApiFetch(token, method, path),
}));

// Mock all lucide-react icons as simple spans
vi.mock('lucide-react', () => {
  const icon = () => <span data-testid="icon" />;
  return {
    // PartidoShell icons
    LayoutDashboard: icon, FileText: icon, Wallet: icon, Handshake: icon,
    Waypoints: icon, History: icon, Settings: icon, LogOut: icon,
    ShieldCheck: icon, Send: icon,
    // NotificationBell
    Bell: icon, CheckCheck: icon,
    // Toast
    CheckCircle: icon, AlertTriangle: icon, Info: icon, X: icon,
    // Page icons
    ArrowRight: icon, ExternalLink: icon, User: icon,
  };
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="next-link">{children}</a>
  ),
}));

import PartidoTrazabilidadPage from './page';

describe('Partido Trazabilidad Page', () => {
  beforeEach(() => {
    apiFetchCalls.length = 0;
    vi.clearAllMocks();
  });

  it('renders the page and fetches bond summary for sidebar', async () => {
    render(<PartidoTrazabilidadPage />);

    // Wait for the page to render after loading (use heading role to avoid nav duplicates)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Trazabilidad' })).toBeInTheDocument();
    });

    // Wait for bonds to appear in sidebar
    await waitFor(() => {
      expect(screen.getByText('SOL-2026-001')).toBeInTheDocument();
    });

    // Assert /bonds/summary was called
    const summaryCalls = apiFetchCalls.filter((c) => c.path === '/bonds/summary');
    expect(summaryCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('fetches traceability when a bond is selected', async () => {
    const user = userEvent.setup();
    render(<PartidoTrazabilidadPage />);

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
    render(<PartidoTrazabilidadPage />);

    // Wait for the page to fully render (use heading role to avoid nav duplicates)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Trazabilidad' })).toBeInTheDocument();
    });

    // Give any pending effects time to fire
    await new Promise((r) => setTimeout(r, 100));

    // Assert NO calls to /transfers
    const transferCalls = apiFetchCalls.filter((c) => c.path.includes('/transfers'));
    expect(transferCalls.length).toBe(0);
  });
});
