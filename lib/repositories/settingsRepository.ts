'use client';

import { storageGet, storageSet } from '../storage';
import { mockSettings } from '../mock/settings';
import type { StoreSettings } from '../types';

const KEY = 'settings';

function seed(): StoreSettings {
  const stored = storageGet<StoreSettings | null>(KEY, null);
  if (stored !== null) return stored;
  storageSet(KEY, mockSettings);
  return mockSettings;
}

export const settingsRepository = {
  get(): StoreSettings {
    return seed();
  },

  update(settings: StoreSettings): void {
    storageSet(KEY, settings);
  },

  reset(): void {
    storageSet(KEY, mockSettings);
  },
};
