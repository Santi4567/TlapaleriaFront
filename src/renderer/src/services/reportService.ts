// src/services/reportService.ts
import { ApiResponse } from '../types/product';
import { 
  ProductPriceHistory, 
  SupplierReportPeriod, 
  SupplierSalesDetailResponse, 
  SupplierSalesReportResponse,
  UserSalesReportPeriod,
  UserSalesReportResponse,
  UserSalesDetailResponse
} from '../types/report';
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
  },

  // --- Obtener corte/ventas por proveedor ---
  async getSupplierSalesReport(
    token: string,
    periodType: SupplierReportPeriod = SupplierReportPeriod.AllTime,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<SupplierSalesReportResponse> | null> {
    try {
      const params = new URLSearchParams();
      params.append('periodType', periodType.toString());

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_URL}/suppliers-sales?${params.toString()}`;

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
      console.error('Error al obtener el reporte de ventas por proveedor:', error);
      return null;
    }
  },

  // --- Obtener desglose de productos vendidos de un proveedor específico ---
  async getSupplierSalesDetail(
    token: string,
    supplierId: number,
    periodType: SupplierReportPeriod = SupplierReportPeriod.AllTime,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<SupplierSalesDetailResponse> | null> {
    try {
      const params = new URLSearchParams();
      params.append('periodType', periodType.toString());

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_URL}/suppliers-sales/${supplierId}?${params.toString()}`;

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
      console.error('Error al obtener el desglose de ventas del proveedor:', error);
      return null;
    }
  },

  // --- Obtener reporte de ventas por usuario (qué vendió cada usuario) ---
  async getUsersSalesReport(
    token: string,
    periodType: UserSalesReportPeriod = UserSalesReportPeriod.Day,
    startDate?: string,
    endDate?: string,
    userId?: number
  ): Promise<ApiResponse<UserSalesReportResponse> | null> {
    try {
      const params = new URLSearchParams();
      params.append('periodType', periodType.toString());

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (userId) params.append('userId', userId.toString());

      const url = `${API_URL}/users-sales?${params.toString()}`;

      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('Error del servidor en users-sales:', response.status, data);
        return data || { success: false, message: `Error HTTP ${response.status}`, data: null };
      }

      return data;
    } catch (error) {
      console.error('Error al obtener el reporte de ventas por usuario:', error);
      return null;
    }
  },

  // --- Obtener detalle de ventas de un usuario específico ---
  async getUserSalesDetail(
    token: string,
    userId: number,
    periodType: UserSalesReportPeriod = UserSalesReportPeriod.Day,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<UserSalesDetailResponse> | null> {
    try {
      const params = new URLSearchParams();
      params.append('periodType', periodType.toString());

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_URL}/users-sales/${userId}?${params.toString()}`;

      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('Error del servidor en user sales detail:', response.status, data);
        return data || { success: false, message: `Error HTTP ${response.status}`, data: null };
      }

      return data;
    } catch (error) {
      console.error('Error al obtener el detalle de ventas del usuario:', error);
      return null;
    }
  }
};
