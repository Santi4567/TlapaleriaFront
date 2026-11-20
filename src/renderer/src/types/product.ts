// src/types/product.ts

// ==========================================
// 1. INTERFACES DE LECTURA (Lo que devuelve la API)
// ==========================================

export interface ProductPresentation {
  id: number;
  productId: number;
  name: string;
  code: string | null;
  barcode: string | null;
  price: number;
  supplierPrice: number;
  stockFactor: number;
  isActive: boolean;
}

export interface SupplierSummary {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  internalCode: string;
  barcode: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  location: string | null;
  supplierId: number;
  supplier?: SupplierSummary | null;
  profitMargin: number | null;
  lastOrderDate?: string | null;
  unitOfMeasure: string;
  currentStock: number;
  minStock?: number;
  maxStock?: number | null;
  reservedStock?: number;
  availableStock?: number;
  presentations: ProductPresentation[];
  isActive: boolean;
  isInventoryTracked?: boolean; // <-- ¿Se controla stock?
  allowFractions?: boolean;     // <-- ¿Permite decimales?
  hasExpiration: boolean;
  nextExpirationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpiringProduct {
  id: number;
  internalCode: string;
  name: string;
  nextExpirationDate: string;
  daysRemaining: number;
}

// ==========================================
// 2. INTERFACES DE ESCRITURA (Creación - POST)
// ==========================================

export interface CreatePresentationRequest {
  id?: number | null;
  name: string;
  code?: string | null;
  barcode?: string | null;
  price: number;
  supplierPrice: number; 
  stockFactor: number;
  isActive?: boolean;
}

export interface CreateProductRequest {
  internalCode: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  location?: string | null;
  supplierId: number;
  profitMargin?: number | null;
  unitOfMeasure: string;
  isInventoryTracked: boolean;
  allowFractions: boolean;
  initialStock: number;
  minStock?: number;
  maxStock?: number | null;
  hasExpiration: boolean;
  nextExpirationDate?: string | null;
  presentations: CreatePresentationRequest[];
}

// ==========================================
// 3. INTERFACES DE ESCRITURA (Actualización - PUT)
// ==========================================

export interface UpdatePresentationRequest {
  id?: number | null; // Si es 0, null o undefined, el backend lo toma como nueva variante
  name: string;
  code?: string | null;
  barcode?: string | null;
  price: number;
  supplierPrice: number;
  stockFactor: number;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  internalCode: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  location?: string | null;
  supplierId: number;
  profitMargin?: number | null;
  unitOfMeasure: string;
  isInventoryTracked: boolean;
  allowFractions: boolean;
  hasExpiration: boolean;
  nextExpirationDate?: string | null;
  minStock?: number;
  maxStock?: number | null;
  // Nota: No se incluye initialStock ni currentStock por regla de negocio
  presentations: UpdatePresentationRequest[];
}

// ==========================================
// 4. ACTUALIZACION RAPIDA DE PRECIOS Y PROVEEDOR (PATCH)
// ==========================================

export interface QuickPresentationPriceItem {
  id: number;
  price: number;
  supplierPrice: number;
  isActive: boolean;
}

export interface QuickPriceUpdateRequest {
  supplierId: number;
  profitMargin?: number | null;
  presentations: QuickPresentationPriceItem[];
}

// ==========================================
// 5. INTERFACES DE RESPUESTA HTTP (APIs)
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface StockUpdateNotification {
  productId: number;
  currentStock: number;
  minStock?: number;
  maxStock?: number | null;
  reservedStock: number;
  availableStock: number;
}

export interface StockReservationResult {
  success: boolean;
  message: string;
  productId: number;
  presentationId: number;
  requestedQuantity: number;
  currentStock: number;
  minStock?: number;
  maxStock?: number | null;
  reservedStock: number;
  availableStock: number;
}

// ==========================================
// 6. STOCK MÍNIMO Y REPORTE DE RESURTIDO
// ==========================================

export interface UpdateStockLevelsRequest {
  minStock: number;
  maxStock?: number | null;
}

export interface LowStockItem {
  productId: number;
  internalCode: string;
  name: string;
  brand?: string | null;
  location?: string | null;
  unitOfMeasure: string;
  allowFractions: boolean;
  currentStock: number;
  minStock: number;
  maxStock?: number | null;
  hasMinConfigured: boolean;
  status: 'OutOfStock' | 'LowStock';
  suggestedQuantity: number;
  unitSupplierCost: number;
  estimatedCost: number;
  lastOrderDate?: string | null;
}

export interface LowStockSupplierGroup {
  supplierId: number;
  supplierName: string;
  supplierContact?: string | null;
  supplierPhone?: string | null;
  productsCount: number;
  estimatedCost: number;
  items: LowStockItem[];
}

export interface LowStockReport {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  productsWithoutMinCount: number;
  totalEstimatedCost: number;
  suppliers: LowStockSupplierGroup[];
}
