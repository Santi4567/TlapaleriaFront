// src/services/brandService.ts
import { ApiResponse } from '../types/product';
import { fetchWithAuth } from "../utils/fetchClient";

export interface Brand {
  id: number;
  name: string;
}

const API_URL = `${import.meta.env.VITE_API_URL}/Brands`;

export const brandService = {
  // OBTENER TODAS LAS MARCAS
  async getBrands(token: string): Promise<ApiResponse<Brand[]> | null> {
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener el catálogo de marcas:', error);
      return null;
    }
  },

  // BUSCAR MARCAS (Autocompletado)
  async searchBrands(token: string, query: string): Promise<ApiResponse<Brand[]> | null> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetchWithAuth(`${API_URL}/search?q=${encodedQuery}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en la búsqueda de marcas:', error);
      return null;
    }
  }
};