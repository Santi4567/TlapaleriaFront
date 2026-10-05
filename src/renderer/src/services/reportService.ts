// src/services/reportService.ts
import { ApiResponse } from '../types/product';
import { ProductPriceHistory } from '../types/report';
import { fetchWithAuth } from '../utils/fetchClient';

const API_URL = `${import.meta.env.VITE_API_URL}/Reports`;

export const reportService = {
  async getProductPriceHistory(
    token: string,
    productId: number,
    presentationId?: number | null,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<ProductPriceHistory> | null> {
    try {
      const params = new URLSearchParams();
      
      // Adjuntar parámetros condicionales
      if (presentationId) params.append('presentationId', presentationId.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const url = `${API_URL}/${productId}/price-history${queryString ? `?${queryString}` : ''}`;

      const response = await fetchWithAuth(url, {
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
      console.error('Error al obtener el historial de precios:', error);
      return null;
    }
  }
};