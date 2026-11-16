// src/components/credit/CreditPaymentModal.tsx
import React, { useState, useEffect } from 'react';
import {
  CreditAccountDetail,
  CustomerSummary,
  RegisterCreditPaymentRequest,
} from '../../types/credit';
import {
  X,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  CreditCard,
  Smartphone,
} from 'lucide-react';

interface CreditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Si se pasa `account`, es abono a un ticket específico; si se pasa `customer` sin `account`, es Abono General FIFO
  account?: CreditAccountDetail | null;
  customer?: CustomerSummary | null;
  onConfirmPayment: (payload: RegisterCreditPaymentRequest) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const CreditPaymentModal: React.FC<CreditPaymentModalProps> = ({
  isOpen,
  onClose,
  account,
  customer,
  onConfirmPayment,
  isSubmitting,
  error,
}) => {
  const isGeneralMode = !account && !!customer;
  const maxBalance = account ? account.balance : customer?.currentDebt || 0;
  const targetName = account ? account.customerName : customer?.name || '';

  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [cashReceivedStr, setCashReceivedStr] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountStr(maxBalance > 0 ? maxBalance.toFixed(2) : '');
      setPaymentMethod('Efectivo');
      setCashReceivedStr('');
      setPaymentReference('');
      setNotes('');
      setLocalError(null);
    }
  }, [isOpen, maxBalance]);

  if (!isOpen) return null;

  const amountNum = Math.round((parseFloat(amountStr) || 0) * 100) / 100;
  const cashReceivedNum = parseFloat(cashReceivedStr) || 0;
  const remainingDebtAfterPayment = Math.max(0, Math.round((maxBalance - amountNum) * 100) / 100);
  const changeToReturn =
    paymentMethod === 'Efectivo' && cashReceivedNum > amountNum
      ? Math.round((cashReceivedNum - amountNum) * 100) / 100
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (amountNum <= 0) {
      setLocalError('Ingresa un monto a abonar mayor a $0.00.');
      return;
    }

    if (amountNum > maxBalance) {
      setLocalError(
        `El monto del abono ($${amountNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}) no puede superar el saldo pendiente ($${maxBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    if (
      (paymentMethod === 'Tarjeta' || paymentMethod === 'Transferencia') &&
      !paymentReference.trim()
    ) {
      setLocalError(
        `Para pagos con ${paymentMethod} es obligatorio capturar la referencia o autorización.`
      );
      return;
    }

    if (paymentMethod === 'Efectivo' && cashReceivedStr.trim() !== '' && cashReceivedNum < amountNum) {
      setLocalError('El billete/efectivo recibido es menor al monto que se va a abonar.');
      return;
    }

    await onConfirmPayment({
      amount: amountNum,
      paymentMethod,
      paymentReference:
        paymentMethod === 'Efectivo'
          ? cashReceivedStr.trim() || amountNum.toFixed(2)
          : paymentReference.trim(),
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-lg w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-6 md:p-8 shadow-[0_0_50px_rgba(255,90,0,0.2)] space-y-5">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
              {isGeneralMode
                ? 'Abono al Saldo General (Reparto Automático)'
                : `Abono a Cuenta ${account?.folio}`}
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5">{targetName}</h3>
            {account && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Ticket de origen: <strong className="text-gray-200">{account.saleFolio}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(localError || error) && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Resumen de Deuda Actual */}
        <div className="bg-black/50 border border-gray-800 rounded-2xl p-4 flex items-center justify-between font-mono">
          <div>
            <span className="text-xs text-gray-400 block font-sans">
              {isGeneralMode ? 'Deuda Total Acumulada:' : 'Saldo Pendiente de esta Cuenta:'}
            </span>
            <strong className="text-2xl font-black text-amber-400">
              ${maxBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAmountStr((Math.round((maxBalance / 2) * 100) / 100).toFixed(2))}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 cursor-pointer"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmountStr(maxBalance.toFixed(2))}
              className="px-3 py-1.5 rounded-xl bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-black border border-brand-orange/40 text-xs font-black cursor-pointer transition-colors"
            >
              Liquidar 100%
            </button>
          </div>
        </div>

        {isGeneralMode && (
          <p className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-xl px-3.5 py-2.5">
            💡 El abono general se aplicará automáticamente empezando por la cuenta más antigua hasta cubrir el monto entregado.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto a Abonar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Monto a Abonar ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-5 h-5 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxBalance}
                required
                autoFocus
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-[#1a1a1a] border-2 border-gray-700 focus:border-brand-orange rounded-2xl pl-11 pr-4 py-3 text-white font-mono text-2xl font-black focus:outline-none"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Método de Pago del Abono
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Efectivo' as const, label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
                { id: 'Transferencia' as const, label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'Tarjeta' as const, label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-brand-orange text-black border-brand-orange shadow-md font-black'
                      : 'bg-[#1a1a1a] text-gray-300 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calculadora de Cambio (Efectivo) o Referencia (Tarjeta/Transferencia) */}
          {paymentMethod === 'Efectivo' ? (
            <div className="grid grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-2xl border border-gray-800">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  ¿Con cuánto paga? (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceivedStr}
                  onChange={(e) => setCashReceivedStr(e.target.value)}
                  placeholder={amountNum.toFixed(2)}
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div className="flex flex-col justify-center text-right font-mono">
                <span className="text-[11px] text-gray-400">Cambio a devolver:</span>
                <span className="text-lg font-black text-brand-orange">
                  ${changeToReturn.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Referencia / Número de Autorización *
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={`Ej. Folio SPEI o Voucher de ${paymentMethod}`}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>
          )}

          {/* Nota opcional */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">
              Nota / Observación del Abono (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Mandó el pago con su hijo / Abono de la semana"
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Saldo Restante tras Abono */}
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 font-mono">
            <span className="text-xs font-sans font-bold text-emerald-300">
              Saldo restante después de este abono:
            </span>
            <strong className="text-lg font-black text-white">
              ${remainingDebtAfterPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amountNum <= 0}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-base transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? 'Registrando Abono...'
                  : remainingDebtAfterPayment === 0
                  ? 'Confirmar y Liquidar Deuda'
                  : 'Registrar Abono'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditPaymentModal;
