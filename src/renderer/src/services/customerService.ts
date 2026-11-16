// src/services/customerService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { ApiResponse, PagedResponse } from '../types/product';
import {
  CreateCustomerRequest,
  CustomerFullProfile,
  CustomerSummary,
  UpdateCustomerRequest,
} from '../types/credit';

const BASE_API = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_API}/Customers`;

export const customerService = {
  async getCustomers(
    token: string,
    options: {
      isActive?: boolean;
      onlyWithDebt?: boolean;
      search?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<PagedResponse<CustomerSummary>> | null> {
    try {
      const params = new URLSearchParams({
        isActive: String(options.isActive ?? true),
        onlyWithDebt: String(options.onlyWithDebt ?? false),
        pageNumber: String(options.pageNumber ?? 1),
        pageSize: String(options.pageSize ?? 20),
      });

      if (options.search && options.search.trim()) {
        params.append('search', options.search.trim());
      }

      const response = await fetchWithAuth(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return null;
    }
  },

  async searchCustomers(
    token: string,
    term: string,
    isActive: boolean = true
  ): Promise<ApiResponse<CustomerSummary[]> | null> {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/search/${encodeURIComponent(term)}?isActive=${isActive}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error al buscar clientes con término ${term}:`, error);
      return null;
    }
  },

  async getCustomerById(
    token: string,
    customerId: number
  ): Promise<ApiResponse<CustomerSummary> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${customerId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener cliente por ID:', error);
      return null;
    }
  },

  async getCustomerFullProfile(
    token: string,
    customerId: number
  ): Promise<ApiResponse<CustomerFullProfile> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${customerId}/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener expediente completo del cliente:', error);
      return null;
    }
  },

  async createCustomer(
    token: string,
    payload: CreateCustomerRequest
  ): Promise<ApiResponse<CustomerSummary>> {
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
          message: data?.message || 'Error al registrar el cliente.',
          data: null as any,
        };
      }
      return data;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      return {
        success: false,
        message: 'Error de conexión al guardar el cliente.',
        data: null as any,
      };
    }
  },

  async updateCustomer(
    token: string,
    customerId: number,
    payload: UpdateCustomerRequest
  ): Promise<ApiResponse<CustomerSummary>> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${customerId}`, {
        method: 'PUT',
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
          message: data?.message || 'Error al actualizar el cliente.',
          data: null as any,
        };
      }
      return data;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      return {
        success: false,
        message: 'Error de conexión al actualizar el cliente.',
        data: null as any,
      };
    }
  },

  async deleteCustomer(
    token: string,
    customerId: number
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${customerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data?.message || 'No se pudo desactivar el cliente.',
          data: null,
        };
      }
      return data;
    } catch (error) {
      console.error('Error al desactivar cliente:', error);
      return {
        success: false,
        message: 'Error de conexión al desactivar el cliente.',
        data: null,
      };
    }
  },
};
