'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Admin layout — guards all /admin/* routes via Supabase Auth.
 *
 * Two-phase auth check:
 *   Phase 1 (fast, no network): getSession() reads the JWT from the local
 *     cookie. No network call. If no session → redirect to login. If session
 *     exists → show dashboard immediately, spinner disappears.
 *   Phase 2 (background): getUser() + profile query validate the token with
 *     Supabase server and check role. Runs after dashboard is already visible.
 *     If token is expired or role is invalid → sign out and redirect to login.
 *
 * Login page bypass: /admin/login renders children directly with no auth check.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseBrowserClient();

        // Phase 1: local session check — no network, near-instant
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session?.user) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        // Session looks valid locally → show dashboard right away
        setAuthChecked(true);

        // Phase 2: background server validation
        const { data: { user }, error: userErr } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userErr || !user) {
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
      } catch {
        if (!cancelled) {
          setAuthChecked(false);
          router.replace('/admin/login');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isLoginPage, pathname, router]);

  // Login page renders without sidebar or auth wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Spinner only while local session check is running (< 50ms normally)
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
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
