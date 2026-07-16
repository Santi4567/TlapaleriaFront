// src/types/pos.ts

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
  // NUEVAS PROPIEDADES PARA LA TABLA VISUAL:
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
  items: CartItem[];
  discount: number;
  createdAt: number;
}