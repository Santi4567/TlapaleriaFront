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
  supplierPrice: number;
  profitMargin: number | null;
  lastOrderDate?: string | null;
  unitOfMeasure: string;
  currentStock: number;
  presentations: ProductPresentation[];
  isActive: boolean;
  isInventoryTracked: boolean;
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
  name: string;
  code?: string | null;
  barcode?: string | null;
  price: number;
  stockFactor: number;
}

export interface CreateProductRequest {
  internalCode: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  location?: string | null;
  supplierId: number;
  supplierPrice: number;
  profitMargin?: number | null;
  unitOfMeasure: string;
  isInventoryTracked: boolean;
  initialStock: number;
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
  stockFactor: number;
}

export interface UpdateProductRequest {
  internalCode: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  location?: string | null;
  supplierId: number;
  supplierPrice: number;
  profitMargin?: number | null;
  unitOfMeasure: string;
  isInventoryTracked: boolean;
  hasExpiration: boolean;
  nextExpirationDate?: string | null;
  // Nota: No se incluye initialStock ni currentStock por regla de negocio
  presentations: UpdatePresentationRequest[];
}

// ==========================================
// 4. INTERFACES DE RESPUESTA HTTP (APIs)
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