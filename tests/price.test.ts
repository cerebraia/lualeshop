import { describe, it, expect } from 'vitest';
import { parsePriceInput } from '../lib/utils';

describe('parsePriceInput', () => {
  it('accepts integer string', () => {
    expect(parsePriceInput('25')).toBe(25);
  });

  it('accepts dot-decimal string', () => {
    expect(parsePriceInput('25.50')).toBe(25.5);
  });

  it('accepts comma-decimal string', () => {
    expect(parsePriceInput('25,50')).toBe(25.5);
  });

  it('accepts "25.5" (one decimal)', () => {
    expect(parsePriceInput('25.5')).toBe(25.5);
  });

  it('accepts "25,5" (one decimal, comma)', () => {
    expect(parsePriceInput('25,5')).toBe(25.5);
  });

  it('rejects zero', () => {
    expect(parsePriceInput('0')).toBeNull();
  });

  it('rejects negative value', () => {
    expect(parsePriceInput('-1')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(parsePriceInput('')).toBeNull();
  });

  it('rejects whitespace-only string', () => {
    expect(parsePriceInput('   ')).toBeNull();
  });

  it('rejects alphabetic text', () => {
    expect(parsePriceInput('abc')).toBeNull();
  });

  it('rejects NaN-producing input', () => {
    expect(parsePriceInput('25abc')).toBeNull();
  });

  it('rounds to two decimal places', () => {
    expect(parsePriceInput('25.999')).toBe(26);
  });

  it('trims surrounding spaces', () => {
    expect(parsePriceInput('  25.50  ')).toBe(25.5);
  });
});

describe('price validation logic (derived from form validate)', () => {
  function validatePurchaseOptions(opts: Array<{ label: string; price: string }>): boolean {
    return opts.every((o) => o.label.trim().length > 0 && parsePriceInput(o.price) !== null);
  }

  it('single option with valid price passes', () => {
    expect(validatePurchaseOptions([{ label: 'Unidad', price: '25' }])).toBe(true);
  });

  it('single option with dot-decimal passes', () => {
    expect(validatePurchaseOptions([{ label: 'Unidad', price: '25.50' }])).toBe(true);
  });

  it('single option with comma-decimal passes', () => {
    expect(validatePurchaseOptions([{ label: 'Unidad', price: '25,50' }])).toBe(true);
  });

  it('single option with zero price fails', () => {
    expect(validatePurchaseOptions([{ label: 'Unidad', price: '0' }])).toBe(false);
  });

  it('single option with empty price fails', () => {
    expect(validatePurchaseOptions([{ label: 'Unidad', price: '' }])).toBe(false);
  });

  it('option without label fails', () => {
    expect(validatePurchaseOptions([{ label: '', price: '25' }])).toBe(false);
  });

  it('two valid options pass', () => {
    expect(validatePurchaseOptions([
      { label: 'Unidad', price: '25' },
      { label: 'Pack x5', price: '100' },
    ])).toBe(true);
  });

  it('two options — one with zero price fails', () => {
    expect(validatePurchaseOptions([
      { label: 'Unidad', price: '25' },
      { label: 'Pack x5', price: '0' },
    ])).toBe(false);
  });
});
