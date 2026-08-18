import { Supplier } from './supplier';

export interface CreatePendingOrderRequest {
  productId: number;
  supplierId: number;
  quantityText: string;
  notes: string;
}

export interface UpdatePendingOrderRequest {
  supplierId: number;
  quantityText: string;
  notes: string;
  status?: number;
}

export interface PendingOrderProduct {
  id: number;
  internalCode: string;
  name: string;
  brand: string;
  location?: string;
  currentStock?: number;
  isInventoryTracked?: boolean;
  supplierPrice?: number;
  profitMargin?: number;
  presentations?: { id: number; stockFactor: number; [key: string]: any }[];
}

export interface PendingOrderUser {
  id: number;
  name: string;
  username: string;
}

export interface PendingOrder {
  id: number;
  productId: number | null;
  product: PendingOrderProduct | null;
  newProductName?: string | null;
  supplierId: number;
  supplier: Supplier;
  userId: number;
  user: PendingOrderUser;
  quantityText: string;
  notes: string;
  status: number; // 0 = Pendiente, 1 = Cancelado, 2 = Completado
  createdAt: string;
  updatedAt: string;
}

export interface APIPendingOrderResponse {
  success: boolean;
  message: string;
  data: PendingOrder;
}

// NUEVO: Estructura de paginación basada en tu JSON real
export interface PaginatedPendingOrders {
  data: PendingOrder[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// ACTUALIZADO: La respuesta de lista envuelve a PaginatedPendingOrders
export interface APIPendingOrdersListResponse {
  success: boolean;
  message: string;
  data: PaginatedPendingOrders;
}