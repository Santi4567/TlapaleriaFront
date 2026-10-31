// src/types/expense.ts

export interface ExpenseSupplierSummary {
  id: number;
  name: string;
  contactName?: string;
  phone?: string;
}

export interface Category {
  id: number;
  name: string;
  type?: 'COGS' | 'Operativo' | string;
  isActive: boolean;
}

export interface Expense {
  id: number;
  concept: string;
  amount: number;
  expenseDate?: string;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque' | string;
  categoryId: number;
  category?: Category;
  supplierId?: number;
  supplier?: ExpenseSupplierSummary;
  accountsPayableId?: number;
  accountsPayable?: AccountPayable;
  scheduleId?: number;
  receiptNumber?: string;
  receiptUrl?: string;
  isActive: boolean;
  createdAt: string;
  cancelledAt?: string;
}

export interface CreateExpenseDto {
  concept: string;
  amount: number;
  paymentMethod: string;
  categoryId: number;
  supplierId?: number;
  accountsPayableId?: number;
  scheduleId?: number;
  receiptNumber?: string;
  receiptUrl?: string;
}

export interface AccountPayable {
  id: number;
  supplierId: number;
  supplier?: ExpenseSupplierSummary;
  concept: string;
  totalAmount: number;
  balance: number;
  status: 'Pendiente' | 'Parcial' | 'Pagado' | 'Vencido' | 'Cancelada' | string;
  dueDate?: string;
  paymentFrequencyDays?: number;
  isActive?: boolean;
  createdAt: string;
  paymentSchedules?: PaymentSchedule[];
}

export interface CreateAccountPayableDto {
  supplierId: number;
  concept: string;
  totalAmount: number;
  dueDate?: string;
  paymentFrequencyDays?: number;
}

export interface PaymentSchedule {
  id: number;
  accountsPayableId: number;
  accountsPayable?: AccountPayable;
  installmentNumber?: number;
  dueDate?: string;
  scheduleDate?: string;
  amount: number;
  status: 'Pendiente' | 'Pagado' | 'Vencido' | 'Cancelada' | string;
}

export interface PaymentReminder {
  id: number;
  scheduleId: number;
  schedule?: PaymentSchedule;
  remindAt: string;
  channel: string;
  status: 'Pendiente' | 'Enviada' | 'Leida' | 'Cancelada' | string;
  sentAt?: string;
  createdAt: string;
}

export interface PagedExpenseResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
