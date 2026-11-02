// src/types/return.ts
import { SaleTicketDetail, SaleTicketDetailLine } from './finance';

export interface ReturnDetailItem {
  id: number;
  returnId: number;
  saleDetailId: number;
  quantityReturned: number;
  refundAmount: number;
  saleDetail?: SaleTicketDetailLine | null;
}

export interface SaleReturnRecord {
  id: number;
  returnFolio: string;
  saleId: number;
  sale?: SaleTicketDetail | null;
  userId: number;
  user?: {
    id: number;
    name: string;
    username?: string;
  } | null;
  totalRefunded: number;
  reason?: string | null;
  createdAt: string;
  details: ReturnDetailItem[];
}

export interface CreateReturnDetailPayload {
  saleDetailId: number;
  quantityReturned: number;
}

export interface CreateReturnPayload {
  saleId: number;
  reason?: string;
  details: CreateReturnDetailPayload[];
}
