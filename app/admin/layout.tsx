'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MigrationRunner } from '@/components/MigrationRunner';

/**
 * Admin layout — guards all /admin/* routes.
 *
 * mock mode:     access allowed, demo banner shown.
 * supabase mode: two-phase auth check to avoid an infinite spinner:
 *
 *   Phase 1 (fast, synchronous-like): getSession() reads the JWT from
 *     the local cookie. No network call. Near-instant. If no session →
 *     redirect to login. If session exists → show dashboard immediately.
 *
 *   Phase 2 (background): getUser() validates the token with the Supabase
 *     server and checks the profile role. If the token is expired or the
 *     profile is inactive → sign out and redirect to login. This runs
 *     after the dashboard is already visible, so no spinner delay.
 *
 * Login page bypass: /admin/login renders children directly without any
 *   auth check. Running the check there caused an infinite spinner because
 *   the "not logged in → redirect to /admin/login" path called router.replace
 *   on the page we were already on, and authChecked never became true.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Mock mode or login page: bypass auth check entirely.
    if (provider !== 'supabase' || isLoginPage) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseBrowserClient();

        // ── Phase 1: fast local session check (no network) ──────────────
        // getSession() reads the JWT from memory/cookie without a server
        // round-trip. Use it to make the UI decision immediately.
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session?.user) {
          // No local session at all → go to login.
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        // Session looks valid locally → show the dashboard right away.
        setAuthChecked(true);

        // ── Phase 2: background validation (network) ─────────────────────
        // Validate the token with Supabase server and check profile role.
        // This happens after the dashboard is already rendered, so there
        // is no visible spinner delay.
        const { data: { user }, error: userErr } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userErr || !user) {
          // Token was invalid or expired; undo the optimistic render.
          setAuthChecked(false);
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('active, role')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (!profile?.active || !['admin', 'owner'].includes(profile.role)) {
          setAuthChecked(false);
          await supabase.auth.signOut();
          router.replace('/admin/login');
        }
        // If profile is valid, the dashboard is already showing — nothing to do.
      } catch {
        if (!cancelled) {
          setAuthChecked(false);
          router.replace('/admin/login');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [provider, isLoginPage, pathname, router]);

  // Login page: render without sidebar or auth wrapper.
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show spinner only while the fast local session check is running.
  // Once getSession() resolves (< 50ms), this disappears.
  if (provider === 'supabase' && !authChecked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <MigrationRunner />
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-brown flex-col shrink-0">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-brown/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-brown flex flex-col">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 bg-white border-b border-rose/10 px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-cream transition-colors text-brown"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-rose rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="font-bold text-brown text-sm">Luale — Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
