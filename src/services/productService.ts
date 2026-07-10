// src/services/productService.ts
import { APIProductsResponse } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  
  // Obtener productos con paginación y filtro de estado
  getProducts: async (
    token: string, 
    page: number = 1, 
    pageSize: number = 50, 
    isActive: boolean = true
  ): Promise<APIProductsResponse | null> => {
    try {
      const response = await fetch(
        `${API_URL}/Products?page=${page}&pageSize=${pageSize}&isActive=${isActive}`, 
        {
          method: 'GET',
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error("Error al obtener productos:", error);
      return null;
    }
  }
};