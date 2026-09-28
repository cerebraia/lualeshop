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
import type { Product, Category, Order, Expense, Customer, StoreSettings, InventoryMovement, MerchandiseEntry, Receivable, Payable, PaymentMethod } from '@/lib/types';
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
  async attemptDelete(id: string): Promise<{
    action: 'deleted' | 'requires_archive';
    productId: string;
    reason: string | null;
    storagePaths?: string[];
  }> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.attemptDelete(id);
    }
    // Mock: always allow delete (no order history in mock)
    const { productRepository } = await import('./repositories/productRepository');
    productRepository.delete(id);
    return { action: 'deleted', productId: id, reason: null, storagePaths: [] };
  },
  async archive(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.archive(id);
    }
    const { productRepository } = await import('./repositories/productRepository');
    productRepository.delete(id);
  },
  async restore(id: string): Promise<void> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.restore(id);
    }
  },
  async findAllIncludingArchived(): Promise<Product[]> {
    if (isSupabase()) {
      const { supabaseProductRepository } = await import('./repositories/supabase/productRepository');
      return supabaseProductRepository.findAllIncludingArchived();
    }
    const { productRepository } = await import('./repositories/productRepository');
    return productRepository.findAll();
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

// ── Receivables (cuentas por cobrar) ─────────────────────────────────────────

export const receivablesRepo = {
  async findAll(): Promise<Receivable[]> {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.findAll();
  },
  async findById(orderId: string): Promise<Receivable | undefined> {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.findById(orderId);
  },
  async registerPayment(orderId: string, amount: number, method: PaymentMethod, date: string, reference?: string, notes?: string): Promise<void> {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.registerPayment(orderId, amount, method, date, reference, notes);
  },
  async voidPayment(paymentId: string, reason: string): Promise<void> {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.voidPayment(paymentId, reason);
  },
  async setDueDate(orderId: string, dueDate: string | null): Promise<void> {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.setDueDate(orderId, dueDate);
  },
  async getSummary() {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.getSummary();
  },
  async createManualReceivable(p: {
    customerName: string;
    description: string;
    total: number;
    dueDate?: string;
    customerId?: string;
    initialPayment?: number;
    paymentMethod?: PaymentMethod;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }): Promise<{ orderId: string; orderNumber: string }> {
    const { supabaseReceivablesRepository } = await import('./repositories/supabase/receivablesRepository');
    return supabaseReceivablesRepository.createManualReceivable(p);
  },
};

// ── Payables (cuentas por pagar) ─────────────────────────────────────────────

export const payablesRepo = {
  async findAll(): Promise<Payable[]> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.findAll();
  },
  async findById(id: string): Promise<Payable | undefined> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.findById(id);
  },
  async create(p: { creditorName: string; description: string; originalAmount: number; issueDate: string; dueDate?: string; supplierId?: string; categoryId?: string; notes?: string }): Promise<string> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.create(p);
  },
  async registerPayment(payableId: string, amount: number, method: PaymentMethod, date: string, reference?: string, notes?: string): Promise<{ paymentId: string; expenseId: string }> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.registerPayment(payableId, amount, method, date, reference, notes);
  },
  async voidPayment(paymentId: string, reason: string): Promise<void> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.voidPayment(paymentId, reason);
  },
  async cancel(payableId: string, reason?: string): Promise<void> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.cancel(payableId, reason);
  },
  async update(payableId: string, fields: { creditorName?: string; description?: string; dueDate?: string | null; notes?: string }): Promise<void> {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.update(payableId, fields);
  },
  async getSummary() {
    const { supabasePayablesRepository } = await import('./repositories/supabase/payablesRepository');
    return supabasePayablesRepository.getSummary();
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
