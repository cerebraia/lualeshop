-- ============================================================
-- 0001 — Extensions & Enum Types
-- ============================================================
-- Run order: first. All other migrations depend on these types.

-- Enable UUID generation
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ── User roles ──────────────────────────────────────────────
create type user_role as enum ('owner', 'admin');

-- ── Product lifecycle ───────────────────────────────────────
-- draft    = being set up, not visible publicly
-- active   = published and visible
-- archived = removed from storefront, history kept
create type product_status as enum ('draft', 'active', 'archived');

-- ── Manual availability override ────────────────────────────
-- automatic     = derive from inventory_levels.quantity_on_hand
-- available     = manually force "available" label
-- low_stock     = manually force "low stock" label
-- out_of_stock  = manually force "out of stock"
-- coming_soon   = teaser — not yet available
-- consult       = "consultar disponibilidad" (current default for all 46 products)
create type manual_availability as enum (
  'automatic', 'available', 'low_stock', 'out_of_stock', 'coming_soon', 'consult'
);

-- ── Order lifecycle ─────────────────────────────────────────
create type order_status as enum (
  'new', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled'
);

-- ── Payment status ──────────────────────────────────────────
create type payment_status as enum ('pending', 'partial', 'paid', 'refunded');

-- ── Payment method ──────────────────────────────────────────
create type payment_method as enum (
  'cash', 'transfer', 'mobile_payment', 'other'
);

-- ── Inventory movement types ─────────────────────────────────
-- More granular than the current TS MovementType ('entry'|'exit'|'adjustment')
create type movement_type as enum (
  'merchandise_entry',   -- stock in via confirmed merchandise entry
  'sale',                -- stock out via confirmed order
  'return',              -- stock in via order return
  'adjustment_in',       -- manual correction adding stock
  'adjustment_out',      -- manual correction removing stock
  'cancellation_restore' -- stock restored when order is cancelled
);

-- ── Merchandise entry status ─────────────────────────────────
create type entry_status as enum ('draft', 'confirmed', 'cancelled');
