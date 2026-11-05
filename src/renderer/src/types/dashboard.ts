// src/types/dashboard.ts

export interface PaymentMethodSummary {
  method: string;
  totalAmount: number;
  count: number;
}

export interface DashboardTopProduct {
  productName: string;
  brand?: string | null;
  totalQuantity: number;
  totalAmount: number;
}

export interface StockAlert {
  productId: number;
  internalCode: string;
  name: string;
  currentStock: number;
  unitOfMeasure: string;
  alertType: 'OutOfStock' | 'LowStock' | 'ExpiringSoon' | string;
  message: string;
  daysRemaining?: number | null;
}

export interface DashboardSummary {
  totalSalesAmount: number;
  grossSalesAmount: number;
  totalRefundedAmount: number;
  totalTicketsCount: number;
  isGlobal: boolean;
  scopeLabel: string;
  paymentMethods: PaymentMethodSummary[];
  topSellingProducts: DashboardTopProduct[];
  stockAlerts: StockAlert[];
}
