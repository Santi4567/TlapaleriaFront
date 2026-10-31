// src/components/expenses/ExpenseCreateModal.tsx
import React, { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import { supplierService } from '../../services/supplierService';
import { AccountPayable, Category, CreateExpenseDto, PaymentSchedule } from '../../types/expense';
import { Supplier } from '../../types/supplier';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDebt?: AccountPayable | null;
  initialSchedule?: PaymentSchedule | null;
}

export const ExpenseCreateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDebt = null,
  initialSchedule = null
}) => {
  const { user } = useAuth();
  const token = user?.token ?? null;

  // Estados del formulario basados en tu DTO
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Estados para catálogo y control de UI
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar las categorías y proveedores reales desde el backend cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
      setError(null);

      if (initialDebt) {
        const installmentLabel = initialSchedule?.installmentNumber
          ? `Cuota #${initialSchedule.installmentNumber} - `
          : 'Abono - ';
        setConcept(`${installmentLabel}${initialDebt.concept}`);
        const suggestedAmount = initialSchedule
          ? Math.min(Number(initialSchedule.amount), Number(initialDebt.balance))
          : Number(initialDebt.balance);
        setAmount(suggestedAmount > 0 ? String(suggestedAmount) : '');
        setSupplierId(initialDebt.supplierId || '');
      } else {
        setConcept('');
        setAmount('');
        setPaymentMethod('Efectivo');
        setSupplierId('');
        setReceiptNumber('');
      }
    }
  }, [isOpen, initialDebt, initialSchedule]);

  const fetchCatalogs = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        expenseService.getCategories(true, token),
        token ? supplierService.getSuppliers(token, 1, 100, true) : Promise.resolve(null)
      ]);

      if (catRes.ok) {
        const resData = await catRes.json();
        const catList: Category[] = resData.data || [];
        setCategories(catList);
        if (catList.length > 0) {
          setCategoryId(catList[0].id);
        }
      }

      if (supRes && supRes.success && supRes.data?.data) {
        setSuppliers(supRes.data.data);
      }
    } catch (err) {
      console.error('Error al cargar catálogos de egresos:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!concept.trim() || !amount || isNaN(parsedAmount) || parsedAmount <= 0 || !categoryId) {
      setError('Por favor completa todos los campos obligatorios con valores válidos.');
      return;
    }

    if (initialDebt && parsedAmount > Number(initialDebt.balance)) {
      setError(
        `El monto del abono ($${parsedAmount.toFixed(2)}) no puede superar el saldo pendiente de la deuda ($${Number(
          initialDebt.balance
        ).toFixed(2)}).`
      );
      return;
    }

    const payload: CreateExpenseDto = {
      concept: concept.trim(),
      amount: parsedAmount,
      paymentMethod,
      categoryId: Number(categoryId),
      supplierId: initialDebt
        ? initialDebt.supplierId
        : supplierId
        ? Number(supplierId)
        : undefined,
      accountsPayableId: initialDebt ? initialDebt.id : undefined,
      scheduleId: initialSchedule ? initialSchedule.id : undefined,
      receiptNumber: receiptNumber.trim() !== '' ? receiptNumber.trim() : undefined
    };

    try {
      setIsLoading(true);
      const response = await expenseService.createExpense(payload, token);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Error al registrar el egreso.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#161616] rounded-3xl w-full max-w-lg border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header del Modal */}
        <div className="px-7 py-5 border-b border-gray-800 flex justify-between items-center bg-[#121212]">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {initialDebt ? 'Registrar Abono a Deuda' : 'Registrar Nuevo Gasto'}
            </h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              {initialDebt
                ? 'El saldo de la cuenta por pagar se descontará automáticamente'
                : 'Registra una salida de dinero de caja, transferencia o cheque'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Banner informativo cuando es abono a una deuda */}
          {initialDebt && (
            <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
                  Cuenta por Pagar #{initialDebt.id}
                </span>
                {initialSchedule && (
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-orange text-black text-xs font-extrabold">
                    Cuota #{initialSchedule.installmentNumber || initialSchedule.id}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white">
                {initialDebt.supplier?.name || `Proveedor #${initialDebt.supplierId}`} — {initialDebt.concept}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-300 pt-1 border-t border-brand-orange/20">
                <span>Total deuda: ${Number(initialDebt.totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                <span className="font-extrabold text-brand-orange">
                  Saldo pendiente: ${Number(initialDebt.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Alerta de Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/40 text-red-400 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Concepto */}
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
              Concepto del Gasto *
            </label>
            <input
              type="text"
              placeholder="Ej: Pago de recibo de luz CFE, Compra de papelería..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors text-sm"
              maxLength={255}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto */}
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Monto ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={initialDebt ? Number(initialDebt.balance) : undefined}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-brand-orange transition-colors text-sm"
                required
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Método de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors text-sm cursor-pointer"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors text-sm cursor-pointer"
                required
              >
                <option value="" disabled>
                  Selecciona una categoría...
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Proveedor opcional (si no viene fijo por deuda) */}
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Proveedor (Opcional)
              </label>
              <select
                value={initialDebt ? initialDebt.supplierId : supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                disabled={Boolean(initialDebt)}
                className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors text-sm disabled:opacity-60 cursor-pointer"
              >
                <option value="">Sin proveedor específico</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Folio / Comprobante (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
              Folio de Ticket o Factura (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: FAC-90210"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors text-sm"
            />
          </div>

          {/* Footer / Botones */}
          <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold transition-colors cursor-pointer"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-sm font-extrabold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : initialDebt ? 'Confirmar Abono' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
