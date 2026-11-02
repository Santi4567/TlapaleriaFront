// src/types/finance.ts

export enum FinancialReportPeriod {
  CustomRange = 0, // Rango libre (por día)
  Day = 1,         // Hoy / Día (por hora)
  Month = 2,       // Mes (por semana)
  Year = 3         // Año (por mes)
}

export interface FinancialChartItem {
  dateLabel: string; // "09:00" | "Sem 1 (01-07)" | "Ene 2026" | "YYYY-MM-DD"
  salesCount: number;
  netAmount: number;
  realProfitAmount: number;
}

export interface FinancialSaleItem {
  saleId: number;
  folio: string;
  createdAt: string;
  cashierName: string;
  paymentMethod: string;
  paymentReference?: string | null;
  itemsCount: number;
  grossAmount: number;
  refundedAmount: number;
  netAmount: number;
  realProfitAmount: number;
  isActive: boolean;
}

export interface FinancialReturnItemDetail {
  saleDetailId: number;
  productName: string;
  quantityReturned: number;
  refundAmount: number;
}

export interface FinancialReturnItem {
  returnId: number;
  returnFolio: string;
  saleId: number;
  saleFolio: string;
  createdAt: string;
  userName: string;
  reason?: string | null;
  totalRefunded: number;
  isFullCancellation: boolean;
  items: FinancialReturnItemDetail[];
}

export interface TopSellingProduct {
  productId: number;
  presentationId: number;
  internalCode: string;
  productName: string;
  presentationName: string;
  brand?: string | null;
  ticketsCount: number;
  quantitySold: number;
  quantityReturned: number;
  netQuantity: number;
  netSalesAmount: number;
  realProfitAmount: number;
}

export interface FinancialReportData {
  totalSalesCount: number;
  grossSalesAmount: number;
  totalRefundedAmount: number;
  netSalesAmount: number;
  costOfGoodsSold: number;
  realProfitAmount: number;
  chartData: FinancialChartItem[];
  sales?: FinancialSaleItem[];
  returns?: FinancialReturnItem[];
  topProducts?: TopSellingProduct[];
}

export interface FinancialReportResponse {
  success: boolean;
  message: string;
  data: FinancialReportData;
}

// Detalle de un ticket individual al consultar GET /api/Sales/{id}
export interface SaleTicketDetailLine {
  id: number;
  saleId: number;
  productId: number;
  presentationId: number;
  productName: string;
  brand?: string | null;
  quantity: number;
  stockFactorApplied: number;
  unitPrice: number;
  subtotal: number;
  supplierPriceAtSale: number;
  supplierCostSubtotal: number;
  isActive: boolean;
}

export interface SaleTicketDetail {
  id: number;
  folio: string;
  totalAmount: number;
  paymentMethod: string;
  paymentReference?: string | null;
  userId: number;
  user?: {
    id: number;
    name: string;
    username: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  details: SaleTicketDetailLine[];
}
