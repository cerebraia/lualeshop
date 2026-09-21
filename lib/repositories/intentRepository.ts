'use client';

import { storageGet, storageSet } from '../storage';
import type { WhatsAppIntent } from '../types';

const KEY = 'whatsapp_intents';

export const intentRepository = {
  findAll(): WhatsAppIntent[] {
    return storageGet<WhatsAppIntent[]>(KEY, []);
  },
  create(intent: WhatsAppIntent): void {
    const all = storageGet<WhatsAppIntent[]>(KEY, []);
    storageSet(KEY, [...all, intent]);
  },
};
