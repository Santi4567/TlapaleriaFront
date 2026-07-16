// src/services/productService.ts
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ApiResponse, 
  PagedResponse,
  ExpiringProduct 
} from '../types/product';

// Ajusta la URL base a la configuración de tu entorno en Tauri / Vite
const API_URL = 'http://tlapalerialeo.local:7000/api/Products';

export const productService = {
  
  // 1. OBTENER CATÁLOGO PAGINADO
  async getProducts(
    token: string, 
    pageNumber: number = 1, 
    pageSize: number = 15, 
    isActive: boolean = true
  ): Promise<ApiResponse<PagedResponse<Product>> | null> {
    try {
      const response = await fetch(
        `${API_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}&isActive=${isActive}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse<PagedResponse<Product>> = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener los productos:', error);
      return null;
    }
  },

  // 2. BUSCADOR POR TÉRMINO (SKU, Código de Barras o Nombre)
  async searchProducts(
    token: string, 
    searchTerm: string, 
    isActive: boolean = true
  ): Promise<ApiResponse<Product[]> | null> {
    try {
      const encodedTerm = encodeURIComponent(searchTerm);
      
      // CORRECCIÓN: Cambiar "searchTerm=" por "query="
      const response = await fetch(
        `${API_URL}/search?query=${encodedTerm}&isActive=${isActive}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse<Product[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error en la búsqueda de productos:', error);
      return null;
    }
  },

  // 3. OBTENER PRODUCTO POR ID (Para llenar el modal de edición)
  async getProductById(
    token: string, 
    id: number, 
    isActive: boolean = true
  ): Promise<ApiResponse<Product> | null> {
    try {
      const response = await fetch(`${API_URL}/${id}?isActive=${isActive}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse<Product> = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al obtener el producto con ID ${id}:`, error);
      return null;
    }
  },

  // 4. CREAR NUEVO PRODUCTO (POST)
  async createProduct(
    token: string, 
    productData: CreateProductRequest
  ): Promise<ApiResponse<Product> | null> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data: ApiResponse<Product> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Ocurrió un error al crear el producto.',
          data: null as any
        };
      }

      return data;
    } catch (error: any) {
      console.error('Error al crear el producto:', error);
      return {
        success: false,
        message: error.message || 'No se pudo conectar con el servidor para registrar el producto.',
        data: null as any
      };
    }
  },

  // 5. ACTUALIZAR PRODUCTO EXISTENTE (PUT)
  async updateProduct(
    token: string, 
    id: number, 
    productData: UpdateProductRequest
  ): Promise<ApiResponse<Product> | null> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data: ApiResponse<Product> = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Ocurrió un error al actualizar el producto.',
          data: null as any
        };
      }

      return data;
    } catch (error: any) {
      console.error(`Error al actualizar el producto ${id}:`, error);
      return {
        success: false,
        message: error.message || 'No se pudo conectar con el servidor para aplicar los cambios.',
        data: null as any
      };
    }
  },

  // 6. ELIMINAR (BORRADO LÓGICO / DESACTIVAR)
  async deleteProduct(token: string, id: number): Promise<ApiResponse<boolean> | null> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data: ApiResponse<boolean> = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el producto');
      }
      return data;
    } catch (error) {
      console.error(`Error al eliminar el producto ${id}:`, error);
      return null;
    }
  },

  // 7. REACTIVAR PRODUCTO ELIMINADO
  async reactivateProduct(token: string, id: number): Promise<ApiResponse<boolean> | null> {
    try {
      const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data: ApiResponse<boolean> = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al reactivar el producto');
      }
      return data;
    } catch (error) {
      console.error(`Error al reactivar el producto ${id}:`, error);
      return null;
    }
  },

  // 8. ALERTA DE PRODUCTOS PRÓXIMOS A CADUCAR
  async getExpiringProducts(token: string): Promise<ApiResponse<ExpiringProduct[]> | null> {
    try {
      const response = await fetch(`${API_URL}/expiring`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse<ExpiringProduct[]> = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener productos próximos a caducar:', error);
      return null;
    }
  }
};