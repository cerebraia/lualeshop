export type InventoryStatus = 'available' | 'low_stock' | 'out_of_stock' | 'coming_soon';
export type OrderStatus = 'new' | 'confirmed' | 'prepared' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type MovementType = 'entry' | 'exit' | 'adjustment';
export type ExpenseCategory = 'merchandise' | 'advertising' | 'delivery' | 'packaging' | 'other';
export type PaymentMethod = 'cash' | 'transfer' | 'mobile_payment' | 'other';

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
  unitDescription?: string; // e.g. "c/u", "set de 5", "par"
  quantityIncluded?: number; // e.g. 5 for "cinco pares"
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
  status: InventoryStatus;
  featured: boolean;
  featuredOrder: number | null;
  isNew: boolean;
  visible: boolean;
  garmentType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // New fields
  catalogNumber?: number;
  purchaseOptions?: ProductPurchaseOption[];
  inventoryConfigured: boolean;
  lowStockThreshold?: number;
  sizeNote?: string;
}

export interface WhatsAppIntent {
  id: string;
  productId: string;
  productName: string;
  purchaseOptionLabel?: string;
  variantSize?: string;
  quantity: number;
  price: number;
  origin: string; // e.g. "product_page"
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
