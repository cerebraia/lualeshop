'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { mapSettings } from './mappers';
import type { StoreSettings } from '@/lib/types';

export const supabaseSettingsRepository = {
  async get(): Promise<StoreSettings> {
    const { data, error } = await getSupabaseBrowserClient()
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw error;
    return mapSettings(data);
  },

  async update(settings: StoreSettings): Promise<void> {
    const { error } = await getSupabaseBrowserClient()
      .from('store_settings')
      .update({
        store_name:       settings.storeName,
        whatsapp_number:  settings.whatsappLink,
        whatsapp_display: settings.whatsapp,
        location:         settings.location,
        delivery_text:    settings.deliveryInfo,
        shipping_text:    settings.shippingInfo,
        tagline:          settings.tagline,
        about_text:       settings.aboutText,
      })
      .eq('id', 1);
    if (error) throw error;
  },
};
