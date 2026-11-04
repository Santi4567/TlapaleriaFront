// src/utils/discount.ts
import { SaleTab } from '../types/pos';

export type DiscountMode = 'PERCENT' | 'AMOUNT';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Suma de precios de lista del carrito (sin descuento). */
export const getGrossSum = (tab: Pick<SaleTab, 'items'>): number =>
  tab.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

/** Monto en pesos que se descuenta (porcentaje tiene prioridad; nunca excede el bruto). */
export const getDiscountAmount = (
  tab: Pick<SaleTab, 'items' | 'discount' | 'discountPercent'>
): number => {
  const gross = getGrossSum(tab);
  const pct = tab.discountPercent || 0;
  if (pct > 0) return Math.min(gross, round2((gross * pct) / 100));
  return Math.min(gross, Math.max(0, tab.discount || 0));
};

export const getNetTotal = (
  tab: Pick<SaleTab, 'items' | 'discount' | 'discountPercent'>
): number => Math.max(0, round2(getGrossSum(tab) - getDiscountAmount(tab)));
