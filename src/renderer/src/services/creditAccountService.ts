// src/services/creditAccountService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { ApiResponse, PagedResponse } from '../types/product';
import {
  CreditAccountDetail,
  CreditPaymentRecord,
  CreditPortfolioSummary,
  GeneralCustomerPaymentResult,
  RegisterCreditPaymentRequest,
  UpdateCreditAccountRequest,
} from '../types/credit';

const BASE_API = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_API}/CreditAccounts`;

export const creditAccountService = {
  async getPortfolioSummary(
    token: string
  ): Promise<ApiResponse<CreditPortfolioSummary> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/summary`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener resumen de cartera de crédito:', error);
      return null;
    }
  },

  async getAccounts(
    token: string,
    options: {
      customerId?: number | null;
      status?: string;
      onlyOverdue?: boolean;
      search?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<PagedResponse<CreditAccountDetail>> | null> {
    try {
      const params = new URLSearchParams({
        pageNumber: String(options.pageNumber ?? 1),
        pageSize: String(options.pageSize ?? 20),
        onlyOverdue: String(options.onlyOverdue ?? false),
      });

      if (options.customerId && options.customerId > 0) {
        params.append('customerId', String(options.customerId));
      }
      if (options.status && options.status.trim()) {
        params.append('status', options.status.trim());
      }
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
      console.error('Error al obtener cuentas de crédito:', error);
      return null;
    }
  },

  async getAccountById(
    token: string,
    accountId: number
  ): Promise<ApiResponse<CreditAccountDetail> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${accountId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al obtener cuenta por ID:', error);
      return null;
    }
  },

  async getAccountBySaleId(
    token: string,
    saleId: number
  ): Promise<ApiResponse<CreditAccountDetail> | null> {
    try {
      const response = await fetchWithAuth(`${API_URL}/sale/${saleId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error al obtener cuenta por saleId:', error);
      return null;
    }
  },

  async registerAccountPayment(
    token: string,
    accountId: number,
    payload: RegisterCreditPaymentRequest
  ): Promise<ApiResponse<CreditAccountDetail>> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${accountId}/payments`, {
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
          message: data?.message || 'Error al registrar el abono.',
          data: null as any,
        };
      }
      return data;
    } catch (error) {
      console.error('Error al registrar abono a cuenta:', error);
      return {
        success: false,
        message: 'Error de conexión al registrar el abono.',
        data: null as any,
      };
    }
  },

  async registerGeneralCustomerPayment(
    token: string,
    customerId: number,
    payload: RegisterCreditPaymentRequest
  ): Promise<ApiResponse<GeneralCustomerPaymentResult>> {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/customer/${customerId}/pay-general`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data?.message || 'Error al registrar el abono general.',
          data: null as any,
        };
      }
      return data;
    } catch (error) {
      console.error('Error al registrar abono general:', error);
      return {
        success: false,
        message: 'Error de conexión al registrar el abono general.',
        data: null as any,
      };
    }
  },

  async updateAccountMetadata(
    token: string,
    accountId: number,
    payload: UpdateCreditAccountRequest
  ): Promise<ApiResponse<CreditAccountDetail>> {
    try {
      const response = await fetchWithAuth(`${API_URL}/${accountId}`, {
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
          message: data?.message || 'Error al actualizar la cuenta.',
          data: null as any,
        };
      }
      return data;
    } catch (error) {
      console.error('Error al actualizar cuenta de crédito:', error);
      return {
        success: false,
        message: 'Error de conexión al actualizar la cuenta.',
        data: null as any,
      };
    }
  },

  async getPaymentsHistory(
    token: string,
    options: {
      customerId?: number | null;
      accountId?: number | null;
      startDate?: string;
      endDate?: string;
      pageNumber?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<PagedResponse<CreditPaymentRecord>> | null> {
    try {
      const params = new URLSearchParams({
        pageNumber: String(options.pageNumber ?? 1),
        pageSize: String(options.pageSize ?? 30),
      });

      if (options.customerId && options.customerId > 0) {
        params.append('customerId', String(options.customerId));
      }
      if (options.accountId && options.accountId > 0) {
        params.append('accountId', String(options.accountId));
      }
      if (options.startDate) {
        params.append('startDate', options.startDate);
      }
      if (options.endDate) {
        params.append('endDate', options.endDate);
      }

      const response = await fetchWithAuth(
        `${API_URL}/payments?${params.toString()}`,
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
      console.error('Error al obtener historial de abonos:', error);
      return null;
    }
  },
};
