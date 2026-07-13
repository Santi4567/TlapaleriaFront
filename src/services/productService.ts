// src/services/productService.ts
import { 
  APIProductsResponse, 
  APISearchProductsResponse, 
  CreateProductRequest, 
  APICreateProductResponse 
} from "../types/product";

const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  
  getProducts: async (
    token: string, 
    page: number = 1, 
    pageSize: number = 15, 
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
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error al obtener productos:", error);
      return null;
    }
  },

  searchProducts: async (
    token: string, 
    query: string, 
    isActive: boolean = true
  ): Promise<APISearchProductsResponse | null> => {
    try {
      const response = await fetch(
        `${API_URL}/Products/search?query=${encodeURIComponent(query)}&isActive=${isActive}`, 
        {
          method: 'GET',
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error al buscar productos con término ${query}:`, error);
      return null;
    }
  },

  // NUEVO: Crear producto y sus presentaciones
  createProduct: async (token: string, productData: CreateProductRequest): Promise<APICreateProductResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/Products`, {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      return await response.json();
    } catch (error) {
      console.error("Error al crear el producto:", error);
      return { success: false, message: "Error de conexión al guardar el producto.", data: null };
    }
  }
};