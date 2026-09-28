export type InventoryStatus = 'available' | 'low_stock' | 'out_of_stock' | 'coming_soon' | 'consult';
export type OrderStatus = 'new' | 'confirmed' | 'prepared' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type MovementType = 'entry' | 'exit' | 'adjustment';
export type ExpenseCategory = 'merchandise' | 'advertising' | 'delivery' | 'packaging' | 'other';
export type PaymentMethod = 'cash' | 'transfer' | 'mobile_payment' | 'other';

// ── Receivables (cuentas por cobrar) ─────────────────────────
export type ReceivableStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type OrderSource = 'admin' | 'manual_receivable';

export interface ReceivablePayment {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
}

export interface Receivable {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  description?: string;   // concept for manual_receivable orders
  source?: OrderSource;
  total: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  orderStatus: OrderStatus;
  status: ReceivableStatus;
  notes?: string;
  createdAt: string;
  payments: ReceivablePayment[];
}

// ── Payables (cuentas por pagar) ─────────────────────────────
export type PayableStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface PayablePayment {
  id: string;
  payableId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  expenseId?: string;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
}

export interface Payable {
  id: string;
  supplierId?: string;
  supplierName?: string;
  creditorName: string;
  description: string;
  categoryId?: string;
  categoryName?: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  issueDate: string;
  dueDate?: string;
  status: PayableStatus;
  notes?: string;
  createdAt: string;
  payments: PayablePayment[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color?: string;
  stock: number;
  sku?: string;
}

export interface ProductPurchaseOption {
  id: string;
  label: string;
  price: number;
  sortOrder?: number;
  unitDescription?: string;
  quantityIncluded?: number;
}

export interface ProductImageRecord {
  id: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  position: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  categoryIds: string[];
  variants: ProductVariant[];
  images: string[];
  productImages?: ProductImageRecord[];
  status: InventoryStatus;
  featured: boolean;
  featuredOrder: number | null;
  isNew: boolean;
  visible: boolean;
  garmentType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  catalogNumber?: number;
  purchaseOptions?: ProductPurchaseOption[];
  inventoryConfigured: boolean;
  lowStockThreshold?: number;
  sizeNote?: string;
  archivedAt?: string;
}

export interface WhatsAppIntent {
  id: string;
  productId: string;
  productName: string;
  purchaseOptionLabel?: string;
  variantSize?: string;
  quantity: number;
  price: number;
  origin: string;
  date: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  reference?: string;
  date: string;
  createdAt: string;
}

export interface MerchandiseEntryItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
}

export interface MerchandiseEntry {
  id: string;
  date: string;
  reference: string;
  supplier?: string;
  items: MerchandiseEntryItem[];
  additionalCosts: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  address?: string;
  notes?: string;
  orderIds: string[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  secondaryTagline: string;
  whatsapp: string;
  whatsappLink: string;
  instagram: string;
  location: string;
  deliveryInfo: string;
  shippingInfo: string;
  currency: string;
  currencySymbol: string;
  domain: string;
  aboutText: string;
}
