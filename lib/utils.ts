export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Generates a real UUID v4. Safe in browser (Web Crypto API) and Node.js 14.17+. */
export function generateId(_prefix?: string): string {
  return crypto.randomUUID();
}

/** Generates a short non-UUID key for React element keys only (never use as a DB id). */
export function generateKey(prefix = 'k'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Central currency formatter — always EUR, locale es-ES (e.g. "20,00 €") */
const _eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return _eurFormatter.format(amount);
}

/** Alias kept for backward compatibility — delegates to formatCurrency */
export function formatPrice(amount: number): string {
  return formatCurrency(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalizes a monetary string entered by the user into a positive number.
 * Accepts dot or comma as decimal separator: "25", "25.50", "25,50".
 * Returns null for empty string, zero, negative values, NaN, or Infinity.
 */
export function parsePriceInput(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  const n = Number(s);
  if (!isFinite(n) || isNaN(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}
