// src/components/pos/PosPaymentMethodModal.tsx
import React from 'react';
import { PaymentMethod } from '../../types/pos';

interface PosPaymentMethodModalProps {
  totalAmount: number;
  onClose: () => void;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PosPaymentMethodModal: React.FC<PosPaymentMethodModalProps> = ({
  totalAmount,
  onClose,
  onSelectMethod
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/50 p-8 shadow-[0_0_50px_rgba(255,90,0,0.2)] text-center space-y-6">
        
        <div>
          <h3 className="text-2xl font-black text-white">Selecciona Método de Pago</h3>
          <p className="text-sm font-mono text-gray-400 mt-1">Total a cobrar:</p>
          <p className="text-4xl font-black font-mono text-brand-orange mt-1">
            ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSelectMethod('CASH')}
            className="w-full py-4 bg-[#1a1a1a] hover:bg-brand-orange text-white hover:text-black font-extrabold text-lg rounded-2xl border border-gray-700 hover:border-brand-orange transition-all flex items-center justify-between px-6 group shadow-md"
          >
            <span className="flex items-center space-x-3">
              <span className="text-2xl">💵</span>
              <span>Efectivo</span>
            </span>
            <span className="text-xs font-mono text-gray-500 group-hover:text-black/70">Pago en mostrador →</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMethod('TRANSFER')}
            className="w-full py-4 bg-[#1a1a1a] hover:bg-brand-orange text-white hover:text-black font-extrabold text-lg rounded-2xl border border-gray-700 hover:border-brand-orange transition-all flex items-center justify-between px-6 group shadow-md"
          >
            <span className="flex items-center space-x-3">
              <span className="text-2xl">🏦</span>
              <span>Transferencia</span>
            </span>
            <span className="text-xs font-mono text-gray-500 group-hover:text-black/70">SPEI / BBVA →</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMethod('CARD')}
            className="w-full py-4 bg-[#1a1a1a] hover:bg-brand-orange text-white hover:text-black font-extrabold text-lg rounded-2xl border border-gray-700 hover:border-brand-orange transition-all flex items-center justify-between px-6 group shadow-md"
          >
            <span className="flex items-center space-x-3">
              <span className="text-2xl">💳</span>
              <span>Tarjeta Débito/Crédito</span>
            </span>
            <span className="text-xs font-mono text-gray-500 group-hover:text-black/70">Terminal TPV →</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-sm transition-colors mt-4"
        >
          ✕ Cancelar / Volver al Ticket
        </button>

      </div>
    </div>
  );
};

export default PosPaymentMethodModal;