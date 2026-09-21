/**
 * Data provider abstraction.
 *
 * NEXT_PUBLIC_DATA_PROVIDER controls which backend is used:
 *   "mock"     → synchronous localStorage repositories (default, no Supabase needed)
 *   "supabase" → async Supabase PostgreSQL repositories
 *
 * All pages and components should call getDataProvider() instead of
 * importing repositories directly, so that swapping the backend
 * only requires setting the env variable.
 *
 * Rules:
 * - Never mix mock reads with Supabase writes.
 * - Never silently fall back to mock in production.
 * - If Supabase env vars are missing and provider=supabase, throw clearly.
 */

export type DataProvider = 'mock' | 'supabase';

export function getDataProvider(): DataProvider {
  const raw = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';

  if (raw === 'supabase') {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error(
        '[DataProvider] NEXT_PUBLIC_DATA_PROVIDER=supabase but ' +
          'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. ' +
          'Set them in .env.local or set NEXT_PUBLIC_DATA_PROVIDER=mock.'
      );
    }
    return 'supabase';
  }

  if (raw !== 'mock') {
    console.warn(
      `[DataProvider] Unknown value "${raw}" for NEXT_PUBLIC_DATA_PROVIDER. ` +
        'Defaulting to "mock". Allowed values: "mock" | "supabase".'
    );
  }

  return 'mock';
}

export function isMockProvider(): boolean {
  return getDataProvider() === 'mock';
}

export function isSupabaseProvider(): boolean {
  return getDataProvider() === 'supabase';
}
