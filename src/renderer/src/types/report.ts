// src/types/report.ts
//import { ApiResponse } from './product'; // Reutilizamos ApiResponse si ya lo tienes ahí

// src/types/report.ts

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

// --- NUEVO: Tipos para el Reporte de Ventas por Proveedor ---
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

