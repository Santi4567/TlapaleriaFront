// src/types/finance.ts

export interface FinancialChartItem {
  dateLabel: string; // YYYY-MM-DD
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