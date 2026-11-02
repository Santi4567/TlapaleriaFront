// src/services/returnService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { ApiResponse, PagedResponse } from '../types/product';
import { CreateReturnPayload, SaleReturnRecord } from '../types/return';

const BASE_API = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_API}/Returns`;

export const returnService = {
  async getReturns(
    token: string,
    search?: string,
    page: number = 1,
    pageSize: number = 25
  ): Promise<ApiResponse<PagedResponse<SaleReturnRecord>> | null> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetchWithAuth(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getReturns:', error);
      return null;
    }
  },

  async getReturnsBySaleId(
    token: string,
    saleId: number
  ): Promise<ApiResponse<SaleReturnRecord[]> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/sale/${saleId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getReturnsBySaleId:', error);
      return null;
    }
  },

  async createReturn(
    token: string,
    payload: CreateReturnPayload
  ): Promise<ApiResponse<SaleReturnRecord>> {
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'No se pudo procesar la devolución.',
          data: null as any,
        };
      }

      return data;
    } catch (error) {
      console.error('Error en createReturn:', error);
      return {
        success: false,
        message: 'No se pudo conectar con el servidor.',
        data: null as any,
      };
    }
  },
};
