// src/services/inventoryService.ts
import { ApiResponse } from '../types/product';
import { InventoryMovementRequest, InventoryMovementResponse } from '../types/inventory';

// Usamos la variable de entorno configurada en Vite
const API_URL = `${import.meta.env.VITE_API_URL}/InventoryMovements`;

export const inventoryService = {
  async registerMovement(
    token: string,
    movementData: InventoryMovementRequest
  ): Promise<ApiResponse<InventoryMovementResponse> | null> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(movementData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Ocurrió un error al registrar el movimiento.',
          data: null as any
        };
      }

      return data;
    } catch (error: any) {
      console.error('Error al registrar movimiento:', error);
      return {
        success: false,
        message: 'No se pudo conectar con el servidor.',
        data: null as any
      };
    }
  }
};