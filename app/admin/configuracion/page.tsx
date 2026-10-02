'use client';

import { useEffect, useState } from 'react';
import { Save, Package, Tag } from 'lucide-react';
import { settingsRepo, productRepo, categoryRepo } from '@/lib/repos';
import type { StoreSettings } from '@/lib/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, prods, cats] = await Promise.all([
          settingsRepo.get(),
          productRepo.findAll(),
          categoryRepo.findAll(),
        ]);
        setSettings(s);
        setProductCount(prods.length);
        setCategoryCount(cats.length);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al cargar datos.');
      }
    })();
  }, []);

  function update(field: keyof StoreSettings, value: string) {
    setSettings((s) => s ? { ...s, [field]: value } : s);
    setSaved(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsRepo.update(settings);
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar configuración.');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <div className="flex items-center justify-center py-20 text-brown-light">Cargando...</div>;
  }

  return (
    <div className="max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Configuración</h1>
          <p className="text-brown-light text-sm">Datos generales de la tienda</p>
        </div>
        <Button onClick={handleSave} loading={saving} size="sm">
          <Save size={14} /> {saved ? 'Guardado ✓' : 'Guardar'}
        </Button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-2xl px-4 py-3 mb-5">
          Configuración guardada correctamente.
        </div>
      )}

      <div className="space-y-6">
        {/* Brand */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <h2 className="font-bold text-brown mb-4">Identidad de la marca</h2>
          <div className="space-y-3">
            <Input label="Nombre de la tienda" value={settings.storeName} onChange={(e) => update('storeName', e.target.value)} />
            <Input label="Frase principal" value={settings.tagline} onChange={(e) => update('tagline', e.target.value)} />
            <Input label="Frase secundaria" value={settings.secondaryTagline} onChange={(e) => update('secondaryTagline', e.target.value)} />
            <Textarea label="Texto sobre nosotros" value={settings.aboutText} onChange={(e) => update('aboutText', e.target.value)} />
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <h2 className="font-bold text-brown mb-4">Contacto y redes</h2>
          <div className="space-y-3">
            <Input label="WhatsApp (visible)" value={settings.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} hint="+58 422-0162748" />
            <Input label="WhatsApp (número técnico)" value={settings.whatsappLink} onChange={(e) => update('whatsappLink', e.target.value)} hint="584220162748 — sin + ni espacios" />
            <Input label="Instagram" value={settings.instagram} onChange={(e) => update('instagram', e.target.value)} />
            <Input label="Ubicación" value={settings.location} onChange={(e) => update('location', e.target.value)} />
            <Input label="Dominio" value={settings.domain} onChange={(e) => update('domain', e.target.value)} />
          </div>
        </section>

        {/* Shipping */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <h2 className="font-bold text-brown mb-4">Envíos y delivery</h2>
          <div className="space-y-3">
            <Textarea label="Información de delivery" value={settings.deliveryInfo} onChange={(e) => update('deliveryInfo', e.target.value)} />
            <Textarea label="Información de envíos" value={settings.shippingInfo} onChange={(e) => update('shippingInfo', e.target.value)} />
          </div>
        </section>

        {/* Currency */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <h2 className="font-bold text-brown mb-4">Moneda</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Moneda" value={settings.currency} onChange={(e) => update('currency', e.target.value)} />
            <Input label="Símbolo" value={settings.currencySymbol} onChange={(e) => update('currencySymbol', e.target.value)} />
          </div>
        </section>

        {/* Catalog info */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <h2 className="font-bold text-brown mb-4">Datos del catálogo</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-brown">
              <Package size={15} className="text-rose" />
              <span><strong>{productCount}</strong> productos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-brown">
              <Tag size={15} className="text-blue-pastel" />
              <span><strong>{categoryCount}</strong> categorías</span>
            </div>
          </div>
        </section>

        <div className="text-right">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save size={16} /> {saved ? 'Guardado ✓' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
