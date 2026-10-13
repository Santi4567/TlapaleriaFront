// src/types/finance.ts

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

export interface FinancialReportData {
  totalSalesCount: number;
  grossSalesAmount: number;
  totalRefundedAmount: number;
  netSalesAmount: number;
  costOfGoodsSold: number;   
  realProfitAmount: number;
  chartData: FinancialChartItem[];
}

export interface FinancialReportResponse {
  success: boolean;
  message: string;
  data: FinancialReportData;
}