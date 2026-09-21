'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MigrationRunner } from '@/components/MigrationRunner';

/**
 * Admin layout — guards all /admin/* routes.
 *
 * mock mode:     access allowed, demo banner shown inside each page.
 * supabase mode: validates session + active profile via Supabase Auth.
 *                Middleware handles the initial redirect; this layout
 *                adds a second check for session expiry during the session.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';

  useEffect(() => {
    if (provider !== 'supabase') {
      setAuthChecked(true);
      return;
    }

    // When provider=supabase, verify the session is still valid
    let cancelled = false;
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!user) {
          router.replace('/admin/login');
          return;
        }

        // Verify the profile is active and has an allowed role
        const { data: profile } = await supabase
          .from('profiles')
          .select('active, role')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (!profile?.active || !['admin', 'owner'].includes(profile.role)) {
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }
      } catch {
        // If Supabase is unreachable, redirect to login rather than granting access
        router.replace('/admin/login');
        return;
      }
      setAuthChecked(true);
    })();

    return () => { cancelled = true; };
  }, [provider, router]);

  // Show nothing while auth is being verified in supabase mode
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
