// src/services/expenseService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { 
  CreateExpenseDto, 
  CreateAccountPayableDto 
} from '../types/expense';

const API_URL = `${import.meta.env.VITE_API_URL}/Expenses`;

const buildHeaders = (token?: string | null, includeJsonContentType = false): Record<string, string> => {
  const headers: Record<string, string> = {
    accept: 'application/json'
  };
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  const cleanParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = String(value);
    }
  });
  return new URLSearchParams(cleanParams).toString();
};

export const expenseService = {
  
  // ==========================================
  // SECCIÓN 1: EGRESOS
  // ==========================================

  /**
   * Obtiene la lista de egresos de forma paginada y filtrada.
   * Query params soportados: page, pageSize, isActive, startDate, endDate.
   */
  getExpenses: async (params?: Record<string, any>, token?: string | null) => {
    const query = buildQueryString(params);
    const url = query ? `${API_URL}?${query}` : API_URL;
    return fetchWithAuth(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  /**
   * Registra una salida de dinero (pago de contado o abono a deuda).
   */
  createExpense: async (data: CreateExpenseDto, token?: string | null) => {
    return fetchWithAuth(API_URL, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify(data)
    });
  },

  /**
   * Anula un egreso (borrado lógico).
   * Restaura el balance de la cuenta por pagar si estaba ligado a una.
   */
  cancelExpense: async (id: number, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/${id}/cancel`, {
      method: 'PUT',
      headers: buildHeaders(token, true),
      body: JSON.stringify({})
    });
  },


  // ==========================================
  // SECCIÓN 2: CUENTAS POR PAGAR (DEUDAS)
  // ==========================================

  /**
   * Obtiene la lista de cuentas por pagar paginada.
   * Query params soportados: page, pageSize, isActive, startDate, endDate.
   */
  getAccountsPayable: async (params?: Record<string, any>, token?: string | null) => {
    const query = buildQueryString(params);
    const url = query ? `${API_URL}/accounts-payable?${query}` : `${API_URL}/accounts-payable`;
    return fetchWithAuth(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  /**
   * Obtiene el detalle de una deuda específica, incluyendo su plan de plazos (PaymentSchedules).
   */
  getAccountPayableById: async (id: number, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/accounts-payable/${id}`, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  /**
   * Registra una nueva deuda con un proveedor.
   * Si incluye dueDate y paymentFrequencyDays, genera cuotas automáticamente.
   */
  createAccountPayable: async (data: CreateAccountPayableDto, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/accounts-payable`, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify(data)
    });
  },


  // ==========================================
  // SECCIÓN 3: RUTAS AUXILIARES
  // ==========================================

  /**
   * Obtiene el catálogo de categorías (por defecto, solo las activas).
   */
  getCategories: async (isActive: boolean = true, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/categories?isActive=${isActive}`, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  /**
   * Obtiene el plan de plazos, filtrable por deuda o estatus.
   * Query params soportados: accountsPayableId, status, startDate, endDate.
   */
  getSchedules: async (params?: Record<string, any>, token?: string | null) => {
    const query = buildQueryString(params);
    const url = query ? `${API_URL}/schedules?${query}` : `${API_URL}/schedules`;
    return fetchWithAuth(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  /**
   * Obtiene los recordatorios de cuotas con status Pendiente 
   * próximos a vencer (o ya vencidos).
   */
  getPendingReminders: async (token?: string | null) => {
    return fetchWithAuth(`${API_URL}/reminders/pending`, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  /**
   * NOTA: Este endpoint no está en la documentación actual del backend, 
   * pero lo implementamos en la vista (RemindersTable) para quitar la alerta.
   * Deberás crear la ruta equivalente en tu ExpensesController.cs
   */
  markReminderAsRead: async (id: number, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/reminders/${id}/read`, {
      method: 'PUT',
      headers: buildHeaders(token, true),
      body: JSON.stringify({})
    });
  }
};
