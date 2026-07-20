// src/components/pos/PosPaymentModal.tsx
import React, { useState } from 'react';
import { PaymentMethod } from '../../types/pos';

interface PosPaymentModalProps {
  method: PaymentMethod;
  totalAmount: number;
  clientName: string;
  isProcessing: boolean;
  onClose: () => void;
  onConfirmPayment: (referenceCode: string) => void;
}

const PosPaymentModal: React.FC<PosPaymentModalProps> = ({
  method,
  totalAmount,
  clientName,
  isProcessing,
  onClose,
  onConfirmPayment
}) => {
  const [reference, setReference] = useState('');
  const [confirmReference, setConfirmReference] = useState('');
  
  const isTransfer = method === 'TRANSFER';

  // REGLA DE VALIDACIÓN: Ambos campos deben tener texto y ser idénticos
  const isMatching = reference.trim().length > 0 && reference.trim() === confirmReference.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatching && !isProcessing) {
      onConfirmPayment(reference.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-8 shadow-[0_0_50px_rgba(255,90,0,0.25)] relative">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{isTransfer ? '🏦' : '💳'}</span>
            <div>
              <h3 className="text-2xl font-black text-white">
                {isTransfer ? 'Pago por Transferencia' : 'Pago con Tarjeta'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">Cliente: {clientName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 block uppercase font-bold">Total a Cobrar</span>
            <span className="text-2xl font-black font-mono text-brand-orange">
              ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* INSTRUCCIONES */}
        {isTransfer ? (
          <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 mb-5 space-y-2">
            <p className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center">
              <span className="mr-1.5">ℹ️</span> Referencia SPEI obligatoria por seguridad
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div><span className="text-gray-500">Banco:</span> <strong className="text-white">BBVA México</strong></div>
              <div><span className="text-gray-500">CLABE:</span> <strong className="text-brand-orange">012650001234567890</strong></div>
            </div>
          </div>
        ) : (
          <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 mb-5">
            <p className="text-xs text-gray-300 font-medium">
              Verifique el número de autorización de la terminal TPV e ingréselo dos veces para confirmar.
            </p>
          </div>
        )}

        {/* FORMULARIO CON DOBLE VALIDACIÓN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5">
              {isTransfer ? 'Número de Referencia SPEI *' : 'Código de Autorización TPV *'}
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder={isTransfer ? "Ej. 992817263" : "Ej. AUT-049281"}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-[#1a1a1a] border-2 border-gray-700 focus:border-brand-orange text-white text-lg font-mono font-bold rounded-2xl px-4 py-3 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 flex justify-between">
              <span>Confirmar {isTransfer ? 'Referencia' : 'Autorización'} *</span>
              {!isMatching && confirmReference.length > 0 && (
                <span className="text-red-500 font-mono text-[11px]">No coinciden los campos</span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="Vuelva a escribir el número exacto"
              value={confirmReference}
              onChange={(e) => setConfirmReference(e.target.value)}
              disabled={isProcessing}
              className={`w-full bg-[#1a1a1a] border-2 text-white text-lg font-mono font-bold rounded-2xl px-4 py-3 focus:outline-none transition-all shadow-inner ${
                confirmReference.length > 0 && !isMatching ? 'border-red-500' : 'border-gray-700 focus:border-brand-orange'
              }`}
            />
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex space-x-4 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isMatching || isProcessing}
              className="w-1/2 py-4 bg-brand-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-800 disabled:cursor-not-allowed text-black font-black text-base rounded-2xl transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] disabled:shadow-none flex items-center justify-center space-x-2 border border-brand-orange"
            >
              <span>{isProcessing ? 'Procesando...' : '✓ Cobro Listo'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PosPaymentModal;