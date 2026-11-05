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
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data;
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
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en la búsqueda de marcas:', error);
      return null;
    }
  },

  // CREAR MARCA DIRECTAMENTE
  async createBrand(token: string, name: string): Promise<ApiResponse<Brand> | null> {
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear la marca:', error);
      return null;
    }
  },

  // RENOMBRAR MARCA (Y actualiza en cascada los productos que la usan)
  async renameBrand(token: string, id: number, name: string): Promise<ApiResponse<Brand> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al renombrar la marca ${id}:`, error);
      return null;
    }
  },

  // FUSIONAR MARCAS (Migra productos de origen a destino y elimina origen)
  async mergeBrands(token: string, sourceBrandId: number, targetBrandId: number): Promise<ApiResponse<number> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/merge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ sourceBrandId, targetBrandId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al fusionar marcas:', error);
      return null;
    }
  },

  // ELIMINAR MARCA (Solo si no tiene productos asociados)
  async deleteBrand(token: string, id: number): Promise<ApiResponse<boolean> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al eliminar la marca ${id}:`, error);
      return null;
    }
  }
};
