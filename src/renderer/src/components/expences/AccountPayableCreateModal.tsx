// src/components/expenses/AccountPayableCreateModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { expenseService } from '../../services/expenseService';
import { supplierService } from '../../services/supplierService';
import { CreateAccountPayableDto } from '../../types/expense';
import { Supplier } from '../../types/supplier';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountPayableCreateModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const token = user?.token ?? null;

  // Estados del formulario basados en CreateAccountsPayableDto
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [concept, setConcept] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentFrequencyDays, setPaymentFrequencyDays] = useState('');

  // Control de UI
  const [hasPlan, setHasPlan] = useState(false); // Toggle para saber si es abonos libres o a plazos
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proveedores reales al abrir
  useEffect(() => {
    if (isOpen) {
      setError(null);
      loadSuppliers();
    }
  }, [isOpen, token]);

  const loadSuppliers = async () => {
    if (!token) return;
    setIsLoadingSuppliers(true);
    try {
      const response = await supplierService.getSuppliers(token, 1, 100, true);
      if (response && response.success && response.data?.data) {
        setSuppliers(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar proveedores para cuentas por pagar:', err);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // Vista previa del cálculo de cuotas igual que en ExpenseService.cs
  const planPreview = useMemo(() => {
    if (!hasPlan || !dueDate || !paymentFrequencyDays || !totalAmount) return null;
    const total = parseFloat(totalAmount);
    const freq = parseInt(paymentFrequencyDays, 10);
    if (isNaN(total) || total <= 0 || isNaN(freq) || freq <= 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(`${dueDate}T00:00:00`);
    const diffDays = Math.round((limit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return null;

    const installments = Math.max(1, Math.floor(diffDays / freq));
    const approxInstallment = total / installments;

    return {
      installments,
      approxInstallment,
      diffDays
    };
  }, [hasPlan, dueDate, paymentFrequencyDays, totalAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedTotal = parseFloat(totalAmount);
    if (!supplierId || !concept.trim() || !totalAmount || isNaN(parsedTotal) || parsedTotal <= 0) {
      setError('Por favor completa el proveedor, concepto y un monto válido mayor a 0.');
      return;
    }

    // Validación extra de tu backend: Si hay frecuencia, DEBE haber fecha límite
    if (hasPlan && (!dueDate || !paymentFrequencyDays)) {
      setError('Para generar un plan de pagos, debes definir la Fecha Límite y la Frecuencia de días.');
      return;
    }

    // Validación de fecha futura
    if (dueDate) {
      const selectedDate = new Date(`${dueDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        setError('La fecha límite debe ser una fecha en el futuro.');
        return;
      }
    }

    const payload: CreateAccountPayableDto = {
      supplierId: Number(supplierId),
      concept: concept.trim(),
      totalAmount: parsedTotal,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : undefined,
      paymentFrequencyDays: hasPlan && paymentFrequencyDays ? parseInt(paymentFrequencyDays, 10) : undefined
    };

    try {
      setIsLoading(true);
      const response = await expenseService.createAccountPayable(payload, token);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Error al registrar la deuda.');
      }

      // Limpiar formulario y cerrar
      setSupplierId('');
      setConcept('');
      setTotalAmount('');
      setDueDate('');
      setPaymentFrequencyDays('');
      setHasPlan(false);

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
            <h2 className="text-xl font-extrabold text-white tracking-tight">Registrar Nueva Deuda</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Compromiso de pago a crédito con proveedor (no descuenta dinero de caja aún)
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
          {error && (
            <div className="bg-red-900/20 border border-red-500/40 text-red-400 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Proveedor */}
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
              Proveedor *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors text-sm cursor-pointer"
              required
              disabled={isLoadingSuppliers}
            >
              <option value="" disabled>
                {isLoadingSuppliers ? 'Cargando proveedores...' : 'Selecciona al proveedor...'}
              </option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
              Concepto / Factura *
            </label>
            <input
              type="text"
              placeholder="Ej: Factura #1024 - Lote de herramienta variada"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-colors text-sm"
              maxLength={255}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto Total */}
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Monto Total de la Deuda ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-brand-orange transition-colors text-sm"
                required
              />
            </div>

            {/* Fecha Límite General */}
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                Fecha Límite {hasPlan ? '*' : '(Opcional)'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors text-sm [color-scheme:dark]"
                required={hasPlan}
              />
            </div>
          </div>

          {/* Switch para Plan de Pagos Automático */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-[#111] border border-gray-800 hover:border-brand-orange/40 transition-colors">
              <input
                type="checkbox"
                checked={hasPlan}
                onChange={(e) => {
                  setHasPlan(e.target.checked);
                  if (!e.target.checked) setPaymentFrequencyDays('');
                }}
                className="w-4 h-4 accent-[#ff6600] rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-white block">
                  Generar plan de pagos (cuotas automáticas)
                </span>
                <span className="text-xs text-brand-text-muted">
                  Divide la deuda en cuotas periódicas y activa recordatorios automáticos
                </span>
              </div>
            </label>
          </div>

          {/* Frecuencia de Pago (Solo visible si activan el plan) */}
          {hasPlan && (
            <div className="bg-[#111] p-4 rounded-2xl border border-brand-orange/30 space-y-3 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-brand-orange uppercase tracking-wider mb-1.5">
                  Frecuencia de Abonos *
                </label>
                <select
                  value={paymentFrequencyDays}
                  onChange={(e) => setPaymentFrequencyDays(e.target.value)}
                  className="w-full bg-[#161616] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-orange text-sm cursor-pointer"
                  required={hasPlan}
                >
                  <option value="" disabled>
                    Selecciona cada cuánto pagarás...
                  </option>
                  <option value="7">Semanal (Cada 7 días)</option>
                  <option value="15">Quincenal (Cada 15 días)</option>
                  <option value="30">Mensual (Cada 30 días)</option>
                </select>
              </div>

              {planPreview ? (
                <div className="bg-brand-orange/10 border border-brand-orange/25 rounded-xl p-3 text-xs text-gray-200 flex items-center justify-between">
                  <span>
                    Se generarán <strong className="text-brand-orange">{planPreview.installments} cuotas</strong> ({planPreview.diffDays} días de plazo)
                  </span>
                  <span className="font-mono font-extrabold text-brand-orange">
                    ~${planPreview.approxInstallment.toLocaleString('es-MX', { minimumFractionDigits: 2 })} / cuota
                  </span>
                </div>
              ) : (
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  El sistema dividirá el monto total entre los días disponibles hasta la fecha límite y creará recordatorios automáticos 1 día antes de cada vencimiento.
                </p>
              )}
            </div>
          )}

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
              {isLoading ? 'Generando...' : 'Registrar Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
