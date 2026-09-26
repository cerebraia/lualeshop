/**
 * Unified async repository layer.
 *
 * All methods return Promises regardless of the active data provider.
 * Admin pages should import from here instead of the individual mock repos.
 *
 * - provider=mock  → wraps synchronous localStorage repos in Promise.resolve
 * - provider=supabase → delegates to the Supabase browser-client repos
 *
 * Never use this file from Server Components (browser client only).
 */

'use client';

import { getDataProvider } from '@/lib/data-provider';
import type { Product, Category, Order, Expense, Customer, StoreSettings, InventoryMovement, MerchandiseEntry } from '@/lib/types';
import type { FinanceSummary } from '@/lib/repositories/supabase/financeRepository';

function isSupabase() {
  return getDataProvider() === 'supabase';
}

// ── Products ──────────────────────────────────────────────────────────────────

export const productRepo = {
  async findAll(): Promise<Product[]> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.findAll();
    }
    const { productRepository } = await import('./repositories/productRepository');
    return productRepository.findAll();
  },
  async findById(id: string): Promise<Product | undefined> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.findById(id);
    }
    const { productRepository } = await import('./repositories/productRepository');
    return productRepository.findById(id);
  },
  async findBySlug(slug: string): Promise<Product | undefined> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.findBySlug(slug);
    }
    const { productRepository } = await import('./repositories/productRepository');
    return productRepository.findBySlug(slug);
  },
  async findVisible(): Promise<Product[]> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.findVisible();
    }
    const { productRepository } = await import('./repositories/productRepository');
    return productRepository.findVisible();
  },
  async findFeatured(): Promise<Product[]> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.findFeatured();
    }
    const { productRepository } = await import('./repositories/productRepository');
    return productRepository.findFeatured();
  },
  async create(product: Product): Promise<void> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.create(product);
    }
    const { productRepository } = await import('./repositories/productRepository');
    productRepository.create(product);
  },
  async update(product: Product): Promise<void> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.update(product);
    }
    const { productRepository } = await import('./repositories/productRepository');
    productRepository.update(product);
  },
  async delete(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.delete(id);
    }
    const { productRepository } = await import('./repositories/productRepository');
    productRepository.delete(id);
  },
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoryRepo = {
  async findAll(): Promise<Category[]> {
    if (isSupabase()) {
      const { supabaseCategoryRepository } = await import('./repositories/supabase/categoryRepository');
      return supabaseCategoryRepository.findAll();
    }
    const { categoryRepository } = await import('./repositories/categoryRepository');
    return categoryRepository.findAll();
  },
  async findActive(): Promise<Category[]> {
    if (isSupabase()) {
      const { supabaseCategoryRepository } = await import('./repositories/supabase/categoryRepository');
      return supabaseCategoryRepository.findActive();
    }
    const { categoryRepository } = await import('./repositories/categoryRepository');
    return categoryRepository.findActive();
  },
  async findById(id: string): Promise<Category | undefined> {
    if (isSupabase()) {
      const { supabaseCategoryRepository } = await import('./repositories/supabase/categoryRepository');
      return supabaseCategoryRepository.findById(id);
    }
    const { categoryRepository } = await import('./repositories/categoryRepository');
    return categoryRepository.findById(id);
  },
  async create(category: Category): Promise<void> {
    if (isSupabase()) {
      const { supabaseCategoryRepository } = await import('./repositories/supabase/categoryRepository');
      return supabaseCategoryRepository.create(category);
    }
    const { categoryRepository } = await import('./repositories/categoryRepository');
    categoryRepository.create(category);
  },
  async update(category: Category): Promise<void> {
    if (isSupabase()) {
      const { supabaseCategoryRepository } = await import('./repositories/supabase/categoryRepository');
      return supabaseCategoryRepository.update(category);
    }
    const { categoryRepository } = await import('./repositories/categoryRepository');
    categoryRepository.update(category);
  },
  async delete(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseCategoryRepository } = await import('./repositories/supabase/categoryRepository');
      return supabaseCategoryRepository.delete(id);
    }
    const { categoryRepository } = await import('./repositories/categoryRepository');
    categoryRepository.delete(id);
  },
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const orderRepo = {
  async findAll(): Promise<Order[]> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.findAll();
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    return orderRepository.findAll();
  },
  async findById(id: string): Promise<Order | undefined> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.findById(id);
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    return orderRepository.findById(id);
  },
  async findByCustomerId(customerId: string): Promise<Order[]> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.findByCustomerId(customerId);
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    return orderRepository.findByCustomerId(customerId);
  },
  async findPaid(): Promise<Order[]> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.findPaid();
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    return orderRepository.findPaid();
  },
  async create(order: Order): Promise<void> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.create(order);
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    orderRepository.create(order);
  },
  async update(order: Order): Promise<void> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.update(order);
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    orderRepository.update(order);
  },
  async delete(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseOrderRepository } = await import('./repositories/supabase/orderRepository');
      return supabaseOrderRepository.delete(id);
    }
    const { orderRepository } = await import('./repositories/orderRepository');
    orderRepository.delete(id);
  },
};

// ── Expenses ──────────────────────────────────────────────────────────────────

export const expenseRepo = {
  async findAll(): Promise<Expense[]> {
    if (isSupabase()) {
      const { supabaseExpenseRepository } = await import('./repositories/supabase/expenseRepository');
      return supabaseExpenseRepository.findAll();
    }
    const { expenseRepository } = await import('./repositories/expenseRepository');
    return expenseRepository.findAll();
  },
  async create(expense: Expense): Promise<void> {
    if (isSupabase()) {
      const { supabaseExpenseRepository } = await import('./repositories/supabase/expenseRepository');
      return supabaseExpenseRepository.create(expense);
    }
    const { expenseRepository } = await import('./repositories/expenseRepository');
    expenseRepository.create(expense);
  },
  async update(expense: Expense): Promise<void> {
    if (isSupabase()) {
      const { supabaseExpenseRepository } = await import('./repositories/supabase/expenseRepository');
      return supabaseExpenseRepository.update(expense);
    }
    const { expenseRepository } = await import('./repositories/expenseRepository');
    expenseRepository.update(expense);
  },
  async delete(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseExpenseRepository } = await import('./repositories/supabase/expenseRepository');
      return supabaseExpenseRepository.delete(id);
    }
    const { expenseRepository } = await import('./repositories/expenseRepository');
    expenseRepository.delete(id);
  },
};

// ── Customers ─────────────────────────────────────────────────────────────────

export const customerRepo = {
  async findAll(): Promise<Customer[]> {
    if (isSupabase()) {
      const { supabaseCustomerRepository } = await import('./repositories/supabase/customerRepository');
      return supabaseCustomerRepository.findAll();
    }
    const { customerRepository } = await import('./repositories/customerRepository');
    return customerRepository.findAll();
  },
  async findById(id: string): Promise<Customer | undefined> {
    if (isSupabase()) {
      const { supabaseCustomerRepository } = await import('./repositories/supabase/customerRepository');
      return supabaseCustomerRepository.findById(id);
    }
    const { customerRepository } = await import('./repositories/customerRepository');
    return customerRepository.findById(id);
  },
  async create(customer: Customer): Promise<void> {
    if (isSupabase()) {
      const { supabaseCustomerRepository } = await import('./repositories/supabase/customerRepository');
      return supabaseCustomerRepository.create(customer);
    }
    const { customerRepository } = await import('./repositories/customerRepository');
    customerRepository.create(customer);
  },
  async update(customer: Customer): Promise<void> {
    if (isSupabase()) {
      const { supabaseCustomerRepository } = await import('./repositories/supabase/customerRepository');
      return supabaseCustomerRepository.update(customer);
    }
    const { customerRepository } = await import('./repositories/customerRepository');
    customerRepository.update(customer);
  },
  async delete(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseCustomerRepository } = await import('./repositories/supabase/customerRepository');
      return supabaseCustomerRepository.delete(id);
    }
    const { customerRepository } = await import('./repositories/customerRepository');
    customerRepository.delete(id);
  },
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const settingsRepo = {
  async get(): Promise<StoreSettings> {
    if (isSupabase()) {
      const { supabaseSettingsRepository } = await import('./repositories/supabase/settingsRepository');
      return supabaseSettingsRepository.get();
    }
    const { settingsRepository } = await import('./repositories/settingsRepository');
    return settingsRepository.get();
  },
  async update(settings: StoreSettings): Promise<void> {
    if (isSupabase()) {
      const { supabaseSettingsRepository } = await import('./repositories/supabase/settingsRepository');
      return supabaseSettingsRepository.update(settings);
    }
    const { settingsRepository } = await import('./repositories/settingsRepository');
    settingsRepository.update(settings);
  },
};

// ── Inventory ─────────────────────────────────────────────────────────────────

export const inventoryRepo = {
  async findAllMovements(): Promise<InventoryMovement[]> {
    if (isSupabase()) {
      const { supabaseInventoryRepository } = await import('./repositories/supabase/inventoryRepository');
      return supabaseInventoryRepository.findAllMovements();
    }
    const { inventoryRepository } = await import('./repositories/inventoryRepository');
    return inventoryRepository.findAllMovements();
  },
  async findMovementsByProduct(productId: string): Promise<InventoryMovement[]> {
    if (isSupabase()) {
      const { supabaseInventoryRepository } = await import('./repositories/supabase/inventoryRepository');
      return supabaseInventoryRepository.findMovementsByProduct(productId);
    }
    const { inventoryRepository } = await import('./repositories/inventoryRepository');
    return inventoryRepository.findMovementsByProduct(productId);
  },
  async createMovement(movement: InventoryMovement): Promise<void> {
    if (isSupabase()) {
      const { supabaseInventoryRepository } = await import('./repositories/supabase/inventoryRepository');
      return supabaseInventoryRepository.createMovement(movement);
    }
    const { inventoryRepository } = await import('./repositories/inventoryRepository');
    inventoryRepository.createMovement(movement);
  },
  async findAllEntries(): Promise<MerchandiseEntry[]> {
    if (isSupabase()) {
      const { supabaseInventoryRepository } = await import('./repositories/supabase/inventoryRepository');
      return supabaseInventoryRepository.findAllEntries();
    }
    const { inventoryRepository } = await import('./repositories/inventoryRepository');
    return inventoryRepository.findAllEntries();
  },
  async createEntry(entry: MerchandiseEntry): Promise<void> {
    if (isSupabase()) {
      const { supabaseInventoryRepository } = await import('./repositories/supabase/inventoryRepository');
      return supabaseInventoryRepository.createEntry(entry);
    }
    const { inventoryRepository } = await import('./repositories/inventoryRepository');
    inventoryRepository.createEntry(entry);
  },
};

// ── Finance ───────────────────────────────────────────────────────────────────

export const financeRepo = {
  async getSummary(from?: string, to?: string): Promise<FinanceSummary> {
    if (isSupabase()) {
      const { supabaseFinanceRepository } = await import('./repositories/supabase/financeRepository');
      return supabaseFinanceRepository.getSummary(from, to);
    }
    // Mock: compute from orders + expenses
    const { orderRepository } = await import('./repositories/orderRepository');
    const { expenseRepository } = await import('./repositories/expenseRepository');
    const paidOrders = orderRepository.findPaid();
    const expenses   = expenseRepository.findAll();
    const totalRevenue   = paidOrders.reduce((s, o) => s + o.total, 0);
    const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      totalRevenue,
      totalExpenses,
      profit:         totalRevenue - totalExpenses,
      paidOrderCount: paidOrders.length,
      expenseCount:   expenses.length,
    };
  },
};
