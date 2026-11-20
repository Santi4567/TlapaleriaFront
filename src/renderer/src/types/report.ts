// src/types/report.ts
import { FinancialSaleItem } from './finance';

export interface PresentationHistoryInfo {
  presentationId: number;
  name: string;
}

export interface PriceHistoryRecord {
  date: string;
  presentationPrices: Record<string, number | null>;
  presentationSupplierPrices: Record<string, number | null>;
  actual: boolean;
}

export interface ProductPriceHistory {
  productId: number;
  productName: string;
  presentations: PresentationHistoryInfo[];
  history: PriceHistoryRecord[];
  actual: boolean;
}

// --- Tipos para el Reporte de Ventas por Proveedor ---
export enum SupplierReportPeriod {
  CustomRange = 0,
  Day = 1,
  Week = 2,
  Month = 3,
  Year = 4,
  AllTime = 5,
}

export interface SupplierSalesReportItem {
  supplierId: number;
  supplierName: string;
  effectiveTickets: number;
  supplierAmount: number;     // Dinero que le toca al proveedor
  totalChargedClient: number; // Total cobrado al cliente (neto de devoluciones)
  profitAmount: number;       // Tu ganancia libre
}

export interface SupplierSalesReportResponse {
  startDate: string | null;
  endDate: string | null;
  totalSupplierAmount: number;
  totalChargedClient: number;
  totalProfitAmount: number;
  suppliers: SupplierSalesReportItem[];
}

// --- Desglose de productos/presentaciones vendidos de un proveedor ---
export interface SupplierProductSalesItem {
  productId: number;
  presentationId: number;
  internalCode: string;
  productName: string;
  presentationName: string;
  brand?: string | null;
  effectiveTickets: number;
  quantitySold: number;
  quantityReturned: number;
  netQuantity: number;
  unitSupplierCost: number;
  unitPublicPrice: number;
  supplierAmount: number;
  totalChargedClient: number;
  profitAmount: number;
}

export interface SupplierSalesDetailResponse {
  supplierId: number;
  supplierName: string;
  startDate: string | null;
  endDate: string | null;
  effectiveTickets: number;
  totalNetQuantity: number;
  totalSupplierAmount: number;
  totalChargedClient: number;
  totalProfitAmount: number;
  products: SupplierProductSalesItem[];
}

// --- Tipos para el Reporte de Ventas por Usuario (Cajero) ---
export enum UserSalesReportPeriod {
  CustomRange = 0,
  Day = 1,
  Week = 2,
  Month = 3,
  Year = 4,
  AllTime = 5,
}

export interface PaymentMethodSummary {
  method: string;
  totalAmount: number;
  count: number;
}

export interface UserProductSalesItem {
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
  unitSupplierCost: number;
  unitPrice: number;
  grossAmount: number;
  refundedAmount: number;
  netAmount: number;
  realProfitAmount: number;
}

export interface UserSalesReportItem {
  userId: number;
  username: string;
  fullName: string;
  userName?: string;
  roleName: string;
  ticketsCount: number;
  grossSalesAmount: number;
  totalRefundedAmount: number;
  netSalesAmount: number;
  costOfGoodsSold: number;
  realProfitAmount: number;
  profitMarginPercent: number;
  totalQuantitySold: number;
  totalQuantityReturned: number;
  netQuantitySold: number;
  paymentMethodsSummary: PaymentMethodSummary[];
  products: UserProductSalesItem[];
}

export interface UserSalesReportResponse {
  periodType: string;
  startDate: string | null;
  endDate: string | null;
  totalUsersCount: number;
  totalTicketsCount: number;
  totalGrossSales: number;
  totalRefundedAmount: number;
  totalNetSales: number;
  totalCostOfGoodsSold: number;
  totalProfitAmount: number;
  totalQuantitySold: number;
  paymentMethodsSummary: PaymentMethodSummary[];
  users: UserSalesReportItem[];
}

export interface UserSalesDetailResponse {
  userId: number;
  username: string;
  fullName: string;
  userName?: string;
  roleName: string;
  periodType: string;
  startDate: string | null;
  endDate: string | null;
  ticketsCount: number;
  grossSalesAmount: number;
  totalRefundedAmount: number;
  netSalesAmount: number;
  costOfGoodsSold: number;
  realProfitAmount: number;
  profitMarginPercent: number;
  totalQuantitySold: number;
  totalQuantityReturned: number;
  netQuantitySold: number;
  paymentMethodsSummary: PaymentMethodSummary[];
  products: UserProductSalesItem[];
  sales: FinancialSaleItem[];
}
