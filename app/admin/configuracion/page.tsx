'use client';

import { useEffect, useState } from 'react';
import { Save, RotateCcw, Package, Tag } from 'lucide-react';
import { settingsRepository } from '@/lib/repositories/settingsRepository';
import { productRepository } from '@/lib/repositories/productRepository';
import { categoryRepository } from '@/lib/repositories/categoryRepository';
import type { StoreSettings } from '@/lib/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    setSettings(settingsRepository.get());
    setProductCount(productRepository.findAll().length);
    setCategoryCount(categoryRepository.findAll().length);
  }, []);

  function update(field: keyof StoreSettings, value: string) {
    setSettings((s) => s ? { ...s, [field]: value } : s);
    setSaved(false);
  }

  function handleSave() {
    if (!settings) return;
    setSaving(true);
    setTimeout(() => {
      settingsRepository.update(settings);
      setSaved(true);
      setSaving(false);
    }, 400);
  }

  function handleReset() {
    settingsRepository.reset();
    setSettings(settingsRepository.get());
    setSaved(false);
  }

  function handleRestoreCatalog() {
    productRepository.reset();
    categoryRepository.reset();
    setProductCount(productRepository.findAll().length);
    setCategoryCount(categoryRepository.findAll().length);
    setShowRestoreModal(false);
  }

  if (!settings) {
    return <div className="flex items-center justify-center py-20 text-brown-light">Cargando...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brown">Configuración</h1>
          <p className="text-brown-light text-sm">Datos generales de la tienda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw size={14} /> Restablecer
          </Button>
          <Button onClick={handleSave} loading={saving} size="sm">
            <Save size={14} /> {saved ? 'Guardado ✓' : 'Guardar'}
          </Button>
        </div>
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
            <Input label="Dominio futuro" value={settings.domain} onChange={(e) => update('domain', e.target.value)} />
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

        {/* Catalog data */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose/10">
          <h2 className="font-bold text-brown mb-4">Datos del catálogo</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-brown">
              <Package size={15} className="text-rose" />
              <span><strong>{productCount}</strong> productos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-brown">
              <Tag size={15} className="text-blue-pastel" />
              <span><strong>{categoryCount}</strong> categorías</span>
            </div>
          </div>
          <p className="text-xs text-brown-light mb-4">
            Restaurar el catálogo original reemplazará los productos y categorías actuales con los datos originales del sistema.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowRestoreModal(true)}>
            <RotateCcw size={14} /> Restaurar catálogo original
          </Button>
        </section>

        <div className="text-right">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save size={16} /> {saved ? 'Guardado ✓' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Restore catalog confirm modal */}
      <Modal open={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Restaurar catálogo original" size="sm">
        <p className="text-sm text-brown-light mb-2">
          Esta acción restaurará los productos y categorías a su estado original.
        </p>
        <p className="text-sm text-red-500 font-medium mb-5">
          Se perderán todos los cambios manuales realizados en productos y categorías.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowRestoreModal(false)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleRestoreCatalog} fullWidth>Restaurar catálogo</Button>
        </div>
      </Modal>
    </div>
  );
}
