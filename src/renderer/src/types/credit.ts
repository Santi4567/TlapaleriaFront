// src/types/credit.ts

export interface CreateCustomerRequest {
  name: string;
  alias?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  creditLimit?: number | null;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  isActive: boolean;
}

export interface CustomerSummary {
  id: number;
  name: string;
  alias?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  creditLimit?: number | null;
  availableCredit?: number | null;
  currentDebt: number;
  activeAccountsCount: number;
  overdueAccountsCount: number;
  totalHistoricalAccountsCount: number;
  lastPurchaseDate?: string | null;
  lastPaymentDate?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreditAccountSaleItem {
  saleDetailId: number;
  productId: number;
  presentationId: number;
  productName: string;
  brand?: string | null;
  quantityTaken: number;
  quantityReturned: number;
  netQuantityKept: number;
  unitPrice: number;
  discountAmount: number;
  originalSubtotal: number;
  refundedSubtotal: number;
  netSubtotal: number;
}

export interface CreditAccountReturnItem {
  saleDetailId: number;
  productName: string;
  quantityReturned: number;
  refundAmount: number;
}

export interface CreditAccountReturn {
  returnId: number;
  returnFolio: string;
  createdAt: string;
  userName: string;
  reason?: string | null;
  totalRefunded: number;
  appliedToDebtAmount: number;
  cashRefundedAmount: number;
  items: CreditAccountReturnItem[];
}

export interface CreditPaymentRecord {
  id: number;
  paymentFolio: string;
  creditAccountId: number;
  creditAccountFolio: string;
  saleId: number;
  saleFolio: string;
  customerId: number;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string | null;
  notes?: string | null;
  receivedByUserName: string;
  createdAt: string;
}

export interface CreditAccountDetail {
  id: number;
  folio: string;
  status: 'Pendiente' | 'Abonado' | 'Liquidado' | 'Cancelado' | string;
  isOverdue: boolean;
  customerId: number;
  customerName: string;
  customerAlias?: string | null;
  customerPhone?: string | null;
  customerSecondaryPhone?: string | null;
  customerAddress?: string | null;
  saleId: number;
  saleFolio: string;
  saleDate: string;
  soldByUserName: string;
  discountPercent: number;
  discountAmount: number;
  originalAmount: number;
  returnedAmount: number;
  netAccountTotal: number;
  paidAmount: number;
  balance: number;
  dueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  totalItemsCount: number;
  items: CreditAccountSaleItem[];
  payments: CreditPaymentRecord[];
  returns: CreditAccountReturn[];
}

export interface CustomerFullProfile {
  customer: CustomerSummary;
  totalHistoricalPurchased: number;
  totalHistoricalPaid: number;
  totalHistoricalReturned: number;
  totalCurrentDebt: number;
  accounts: CreditAccountDetail[];
  recentPayments: CreditPaymentRecord[];
}

export interface RegisterCreditPaymentRequest {
  amount: number;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  paymentReference?: string | null;
  notes?: string | null;
}

export interface UpdateCreditAccountRequest {
  dueDate?: string | null;
  notes?: string | null;
}

export interface GeneralCustomerPaymentResult {
  customerId: number;
  customerName: string;
  totalAmountApplied: number;
  previousTotalDebt: number;
  remainingTotalDebt: number;
  accountsAffectedCount: number;
  accountsSettledCount: number;
  appliedPayments: CreditPaymentRecord[];
}

export interface CreditPortfolioSummary {
  totalReceivableBalance: number;
  customersWithDebtCount: number;
  activeAccountsCount: number;
  overdueAccountsCount: number;
  overdueBalance: number;
  creditGrantedTodayAmount: number;
  collectedTodayAmount: number;
}
