// src/services/inventoryService.ts
import { ApiResponse, PagedResponse } from '../types/product';
import { InventoryMovementRequest, InventoryMovementResponse, GetMovementsParams } from '../types/inventory';
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
  },

  // 2. OBTENER MOVIMIENTOS (Global, por Producto, por Fechas, etc.)
  async getMovements(
    token: string,
    params: GetMovementsParams
  ): Promise<ApiResponse<PagedResponse<InventoryMovementResponse>> | null> {
    try {
      // Construcción dinámica de Query Parameters
      const queryParams = new URLSearchParams();
      
      // Valores por defecto si no se envían
      queryParams.append('page', (params.page || 1).toString());
      queryParams.append('pageSize', (params.pageSize || 100).toString());

      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.productId) queryParams.append('productId', params.productId.toString());
      if (params.movementType) queryParams.append('movementType', params.movementType.toString());

      const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener movimientos de inventario:', error);
      return null;
    }
  }
};