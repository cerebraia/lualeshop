'use client';

import { useEffect } from 'react';
import { runMigrations } from '@/lib/migrations';

export function MigrationRunner() {
  useEffect(() => {
    runMigrations();
  }, []);
  return null;
}
