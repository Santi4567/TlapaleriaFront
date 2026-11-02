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
