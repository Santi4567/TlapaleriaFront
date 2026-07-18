// src/types/pos.ts

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

export interface CartItem {
  productId: number;
  presentationId: number;
  internalCode: string;
  barcode: string | null;
  name: string;
  presentationName: string;
  unitPrice: number;
  quantity: number;
  stockFactor: number;
  maxStock: number;
  brand?: string | null;
  location?: string | null;
  unitOfMeasure: string;
}

export interface SaleTab {
  id: string;
  title: string;
  type: 'SALE' | 'QUOTE';
  tabNumber: number;
  isRemovable?: boolean;
  clientName: string;
  paymentMethod: PaymentMethod; // NUEVO: Método de pago seleccionado
  items: CartItem[];
  discount: number;
  createdAt: number;
}