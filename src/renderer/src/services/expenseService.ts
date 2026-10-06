// src/services/expenseService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import { 
  CreateExpenseDto, 
  CreateAccountPayableDto 
} from '../types/expense';

export const expenseService = {
  
  // ==========================================
  // SECCIÓN 1: EGRESOS
  // ==========================================

  /**
   * Obtiene la lista de egresos de forma paginada y filtrada.
   * Query params soportados: page, pageSize, isActive, startDate, endDate.
   */
  getExpenses: async (params?: Record<string, any>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `/api/Expenses?${query}` : '/api/Expenses';
    return fetchWithAuth(url);
  },

  /**
   * Registra una salida de dinero (pago de contado o abono a deuda).
   */
  createExpense: async (data: CreateExpenseDto) => {
    return fetchWithAuth('/api/Expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * Anula un egreso (borrado lógico).
   * Restaura el balance de la cuenta por pagar si estaba ligado a una.
   */
  cancelExpense: async (id: number) => {
    return fetchWithAuth(`/api/Expenses/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
  getAccountsPayable: async (params?: Record<string, any>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `/api/Expenses/accounts-payable?${query}` : '/api/Expenses/accounts-payable';
    return fetchWithAuth(url);
  },

  /**
   * Obtiene el detalle de una deuda específica, incluyendo su plan de plazos (PaymentSchedules).
   */
  getAccountPayableById: async (id: number) => {
    return fetchWithAuth(`/api/Expenses/accounts-payable/${id}`);
  },

  /**
   * Registra una nueva deuda con un proveedor.
   * Si incluye dueDate y paymentFrequencyDays, genera cuotas automáticamente.
   */
  createAccountPayable: async (data: CreateAccountPayableDto) => {
    return fetchWithAuth('/api/Expenses/accounts-payable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },


  // ==========================================
  // SECCIÓN 3: RUTAS AUXILIARES
  // ==========================================

  /**
   * Obtiene el catálogo de categorías (por defecto, solo las activas).
   */
  getCategories: async (isActive: boolean = true) => {
    return fetchWithAuth(`/api/Expenses/categories?isActive=${isActive}`);
  },

  /**
   * Obtiene el plan de plazos, filtrable por deuda o estatus.
   * Query params soportados: accountsPayableId, status, startDate, endDate.
   */
  getSchedules: async (params?: Record<string, any>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `/api/Expenses/schedules?${query}` : '/api/Expenses/schedules';
    return fetchWithAuth(url);
  },

  /**
   * Obtiene los recordatorios de cuotas con status Pendiente 
   * próximos a vencer (o ya vencidos).
   */
  getPendingReminders: async () => {
    return fetchWithAuth('/api/Expenses/reminders/pending');
  },

  /**
   * NOTA: Este endpoint no está en la documentación actual del backend, 
   * pero lo implementamos en la vista (RemindersTable) para quitar la alerta.
   * Deberás crear la ruta equivalente en tu ExpensesController.cs
   */
  markReminderAsRead: async (id: number) => {
    return fetchWithAuth(`/api/Expenses/reminders/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  }
};