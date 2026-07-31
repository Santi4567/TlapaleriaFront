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
  movementType: number;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string;
  createdAt: string;
}