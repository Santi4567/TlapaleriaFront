// src/types/inventory.ts

export interface InventoryMovementRequest {
  productId: number;
  movementType: number; // 1 = Aumento, 2 = Decremento
  quantity: number;
  notes: string;
}

export interface InventoryMovementResponse {
  id: number;
  productId: number;
  product?: { // El backend a veces trae el producto anidado
    id: number;
    internalCode: string;
    name: string;
    unitOfMeasure: string;
  };
  user?: { // Y el usuario que hizo el movimiento
    name: string;
  };
  movementType: number;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string;
  createdAt: string;
}

// Interfaz para los Query Params de la búsqueda
export interface GetMovementsParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  productId?: number;
  movementType?: number;
}

// Diccionario visual para la Interfaz (Colores y Textos)
export const MOVEMENT_TYPES: Record<number, { label: string; color: string; sign: string }> = {
  1: { label: 'Entrada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', sign: '+' },
  2: { label: 'Merma', color: 'text-red-400 bg-red-500/10 border-red-500/30', sign: '-' },
  3: { label: 'Ajuste Positivo', color: 'text-green-400 bg-green-500/10 border-green-500/30', sign: '+' },
  4: { label: 'Ajuste Negativo', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', sign: '-' },
  5: { label: 'Venta', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', sign: '-' },
  6: { label: 'Devolución', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', sign: '+' }
};