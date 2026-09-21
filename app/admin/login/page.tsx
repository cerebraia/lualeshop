'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

async function signIn(email: string, password: string) {
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

const ALLOWED_NEXT_PATHS = /^\/admin(\/[a-z0-9\-_/]*)?$/;

// Inner component uses useSearchParams — must be inside <Suspense>
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';
  const isMock = provider !== 'supabase';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (isMock) {
        router.push('/admin');
        return;
      }

      if (!email.trim() || !password) {
        setError('Completa el email y la contraseña.');
        return;
      }

      setLoading(true);
      try {
        const { error: authError } = await signIn(email.trim(), password);
        if (authError) {
          setError(
            authError.message.includes('Invalid login')
              ? 'Email o contraseña incorrectos.'
              : authError.message
          );
          return;
        }

        const next = searchParams.get('next') ?? '/admin';
        const safePath = ALLOWED_NEXT_PATHS.test(next) ? next : '/admin';
        router.push(safePath);
        router.refresh();
      } catch {
        setError('No se pudo conectar. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, isMock, router, searchParams]
  );

  return (
    <>
      {/* Demo banner */}
      {isMock && (
        <div className="mb-5 p-4 rounded-2xl bg-yellow-soft/30 border border-yellow-soft text-sm text-brown">
          <p className="font-bold mb-1">Modo demo activo</p>
          <p className="text-brown-light">No se requiere contraseña. Conecta Supabase para activar autenticación real.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-7 shadow-sm border border-rose/10 space-y-5"
      >
        <h1 className="text-xl font-extrabold text-brown">Iniciar sesión</h1>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-brown-light uppercase tracking-wide" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isMock}
            placeholder={isMock ? 'demo@lualekids.shop' : 'admin@lualekids.shop'}
            className="w-full px-4 py-3 rounded-2xl border border-rose/20 text-brown text-sm focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/15 transition-all disabled:bg-cream disabled:text-brown-light"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-brown-light uppercase tracking-wide" htmlFor="password">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || isMock}
              placeholder={isMock ? '••••••••' : 'Tu contraseña'}
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-rose/20 text-brown text-sm focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/15 transition-all disabled:bg-cream disabled:text-brown-light"
            />
            {!isMock && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brown-light hover:text-brown transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-brown hover:bg-brown/90 text-white font-bold py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn size={16} />
          )}
          {isMock ? 'Entrar al panel demo' : loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        {!isMock && (
          <p className="text-center text-xs text-brown-light pt-1">
            ¿Olvidaste tu contraseña? Contacta al propietario de la cuenta.
          </p>
        )}
      </form>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
              <Image src="/logo.jpg" alt="Luale Kids Shop" width={48} height={48} className="w-full h-full object-contain" priority />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-brown text-lg leading-tight">Luale Kids</p>
              <p className="text-xs text-brown-light font-medium">Panel de administración</p>
            </div>
          </div>
        </div>

        {/* useSearchParams requires Suspense */}
        <Suspense fallback={
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-rose/10 flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-brown-light mt-6">
          Luale Kids Shop &mdash; Panel privado
        </p>
      </div>
    </div>
  );
}
