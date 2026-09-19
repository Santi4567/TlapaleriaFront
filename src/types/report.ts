// src/types/report.ts
//import { ApiResponse } from './product'; // Reutilizamos ApiResponse si ya lo tienes ahí

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