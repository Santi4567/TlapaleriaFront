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

export interface PaginatedData {
  data: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface APIProductsResponse {
  success: boolean;
  message: string;
  data: PaginatedData;
}

export interface APISearchProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
}

// agregar Presentacion: Interfaz para crear una presentación en el POST
export interface CreatePresentationRequest {
  name: string;
  code: string;
  barcode: string;
  price: number;
  stockFactor: number;
}

// Agregar: Interfaz para el POST de un nuevo producto
export interface CreateProductRequest {
  internalCode: string;
  barcode: string;
  name: string;
  description: string;
  brand: string;
  location: string;
  supplierId: number;
  supplierPrice: number;
  profitMargin: number;
  unitOfMeasure: string;
  isInventoryTracked: boolean;
  initialStock: number;
  hasExpiration: boolean;
  nextExpirationDate: string | null;
  presentations: CreatePresentationRequest[];
}

export interface APICreateProductResponse {
  success: boolean;
  message: string;
  data: Product | null;
}