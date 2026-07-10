// src/types/supplier.ts

export interface Supplier {
  id: number;
  name: string;
  contactName: string;
  phone: string;
  isActive: boolean;
}

export interface APISuppliersResponse {
  success: boolean;
  message: string;
  data: Supplier[];
}