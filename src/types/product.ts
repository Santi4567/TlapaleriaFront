// src/types/product.ts

export interface ProductPresentation {
  id: number;
  productId: number;
  name: string;
  code: string;
  barcode: string | null;
  price: number;
  stockFactor: number;
  isActive: boolean;
}

export interface Product {
  id: number;
  internalCode: string;
  barcode: string | null;
  name: string;
  description: string;
  brand: string;
  location: string;
  supplierId: number;
  supplier: any | null;
  supplierPrice: number;
  profitMargin: number;
  lastOrderDate: string | null;
  unitOfMeasure: string;
  currentStock: number;
  presentations: ProductPresentation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isInventoryTracked: boolean;
  hasExpiration: boolean;
  nextExpirationDate: string | null;
}

// Estructura de la paginación que viene dentro de "data"
export interface PaginatedData {
  data: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// Estructura principal de la respuesta de la API
export interface APIProductsResponse {
  success: boolean;
  message: string;
  data: PaginatedData;
}