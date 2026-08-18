import { 
  CreatePendingOrderRequest, 
  UpdatePendingOrderRequest,
  APIPendingOrderResponse,
  APIPendingOrdersListResponse,
  changeOrderStatus,
  processMerchandiseReceipt
} from '../types/pendingOrder';
import { fetchWithAuth } from "../utils/fetchClient";

const API_URL = import.meta.env.VITE_API_URL;

export const pendingOrderService = {
  
  // ACTUALIZADO: Soporta todos los parámetros de tu API
  getPendingOrders: async (
    token: string, 
    status: number | null = null, 
    page: number = 1, 
    pageSize: number = 50,
    search?: string,
    supplierId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<APIPendingOrdersListResponse | null> => {
    try {
      // Usamos URLSearchParams para armar la URL dinámicamente
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (status !== null) params.append('status', status.toString());
      if (search) params.append('search', search);
      if (supplierId) params.append('supplierId', supplierId.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetchWithAuth(`${API_URL}/PendingOrders/filter?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error al obtener la libreta de pedidos:", error);
      return null;
    }
  },
  

  createPendingOrder: async (token: string, data: CreatePendingOrderRequest): Promise<APIPendingOrderResponse | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/PendingOrders`, {
        method: 'POST',
        headers: { 'accept': 'text/plain', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) { return null; }
  },

  updatePendingOrder: async (token: string, id: number, data: UpdatePendingOrderRequest): Promise<APIPendingOrderResponse | null> => {
    // ... (Se mantiene igual)
    try {
      const response = await fetchWithAuth(`${API_URL}/PendingOrders/${id}`, {
        method: 'PUT',
        headers: { 'accept': 'text/plain', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) { return null; }
  },

  changeOrderStatus: async (token: string, id: number, status: number): Promise<APIPendingOrderResponse | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/PendingOrders/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'accept': 'text/plain', 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status }) // Enviamos el JSON tal como lo pide tu cURL
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) { 
      console.error("Error al cambiar el estado:", error);
      return null; 
    }
  },

  // Recibir mercancia 
  processMerchandiseReceipt: async (token: string, id: number, payload: any): Promise<APIPendingOrderResponse | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/PendingOrders/${id}/receive`, { // <-- Ajusta la URL de tu endpoint aquí
        method: 'POST',
        headers: { 'accept': 'text/plain', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) { 
      console.error("Error al procesar recepción:", error);
      return null; 
    }
  }

};