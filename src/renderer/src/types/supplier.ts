// src/types/supplier.ts

export interface Supplier {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  isActive: boolean;
}

// NUEVO: Estructura que envuelve los datos paginados
export interface PaginatedSuppliersData {
  data: Supplier[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// ACTUALIZADO: Respuesta de getSuppliers (ahora devuelve paginación)
export interface APISuppliersResponse {
  success: boolean;
  message: string;
  data: PaginatedSuppliersData;
}

// NUEVO: Respuesta para searchSuppliers (arreglo plano)
export interface APISearchSuppliersResponse {
  success: boolean;
  message: string;
  data: Supplier[];
}

export interface CreateSupplierRequest {
  name: string;
  contactName: string;
  phone?: string;
}

export interface UpdateSupplierRequest {
  name: string;
  contactName: string;
  phone: string;
  isActive: boolean;
}

export interface APICreateSupplierResponse {
  success: boolean;
  message: string;
  data: Supplier | null;
}