// src/services/saleService.ts
const BASE_API = import.meta.env.VITE_API_URL 
const API_URL = `${BASE_API}/Sales`;

export const saleService = {
  async createSale(token: string, payload: any) {
    try {
      const response = await fetch(API_URL, {
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
  }
};