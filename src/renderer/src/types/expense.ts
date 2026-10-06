// src/types/expense.ts

export interface Expense {
  id: number;
  concept: string;
  amount: number;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque';
  categoryId: number;
  supplierId?: number;
  accountsPayableId?: number;
  scheduleId?: number;
  receiptNumber?: string;
  receiptUrl?: string;
  isActive: boolean;
  createdAt: string;
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
}

export interface AccountPayable {
  id: number;
  supplierId: number;
  concept: string;
  totalAmount: number;
  balance: number;
  status: 'Pendiente' | 'Parcial' | 'Pagado' | 'Vencido' | 'Cancelada';
  dueDate?: string;
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
  scheduleDate: string;
  amount: number;
  status: string;
}

export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}