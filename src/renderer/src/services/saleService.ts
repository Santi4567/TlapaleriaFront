// src/services/saleService.ts
import { fetchWithAuth } from "../utils/fetchClient";
import { ApiResponse, PagedResponse } from "../types/product";
import { SaleTicketDetail } from "../types/finance";

const BASE_API = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_API}/Sales`;

export const saleService = {
  async createSale(token: string, payload: any) {
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, message: data.message || 'Error al procesar la venta.' };
      }

      return data;
    } catch (error: any) {
      console.error('Error en createSale:', error);
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
  },

  async getSales(
    token: string,
    searchFolio?: string,
    page: number = 1,
    pageSize: number = 25
  ): Promise<ApiResponse<PagedResponse<SaleTicketDetail>> | null> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchFolio && searchFolio.trim()) {
        params.append('searchFolio', searchFolio.trim());
      }

      const response = await fetchWithAuth(`${API_URL}?${params.toString()}`, {
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
      console.error('Error al buscar historial de ventas:', error);
      return null;
    }
  },

  async getSaleById(token: string, saleId: number): Promise<ApiResponse<SaleTicketDetail> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${saleId}`, {
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
      console.error('Error al obtener el ticket por ID:', error);
      return null;
    }
  }
};
