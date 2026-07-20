// src/components/pos/PosCashModal.tsx
import React, { useState } from 'react';

interface PosCashModalProps {
  totalAmount: number;
  onClose: () => void;
  onConfirm: (receivedAmount: number, change: number) => void;
  isProcessing: boolean;
}

const PosCashModal: React.FC<PosCashModalProps> = ({
  totalAmount,
  onClose,
  onConfirm,
  isProcessing
}) => {
  const [received, setReceived] = useState<string>('');
  
  const receivedNum = parseFloat(received) || 0;
  const change = Math.max(0, receivedNum - totalAmount);
  
  // REGLA: El efectivo recibido debe ser mayor o igual al total
  const isValid = receivedNum >= totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isProcessing) {
      onConfirm(receivedNum, change);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-8 shadow-[0_0_50px_rgba(255,90,0,0.25)] space-y-6">
        
        <div className="text-center border-b border-gray-800 pb-4">
          <span className="text-3xl">💵</span>
          <h3 className="text-2xl font-black text-white mt-1">Cobro en Efectivo</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Captura obligatoria de efectivo</p>
        </div>

        <div className="space-y-4 font-mono">
          <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-gray-800">
            <span className="text-sm font-bold text-gray-400">Total a Pagar:</span>
            <span className="text-2xl font-black text-white">
              ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-orange uppercase tracking-widest mb-1.5 flex justify-between">
              <span>Efectivo Recibido ($) *</span>
              {!isValid && receivedNum > 0 && <span className="text-red-500">Monto insuficiente</span>}
            </label>
            <input
              type="number"
              step="any"
              autoFocus
              required
              placeholder="0.00"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              className={`w-full bg-[#1a1a1a] border-2 text-white text-3xl font-black rounded-2xl px-5 py-3.5 text-right focus:outline-none transition-all shadow-inner placeholder-gray-600 ${
                !isValid && receivedNum > 0 ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-brand-orange'
              }`}
            />
          </div>

          <div className={`flex justify-between items-center p-4 rounded-2xl border transition-colors ${
            isValid ? 'bg-brand-orange/10 border-brand-orange/30' : 'bg-black/40 border-gray-800 opacity-50'
          }`}>
            <span className={`text-sm font-bold ${isValid ? 'text-brand-orange' : 'text-gray-500'}`}>Cambio a Devolver:</span>
            <span className={`text-3xl font-black ${isValid ? 'text-brand-orange' : 'text-gray-500'}`}>
              ${change.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex space-x-3 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-bold rounded-2xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid || isProcessing}
            className="w-1/2 py-4 bg-brand-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-800 disabled:shadow-none disabled:cursor-not-allowed text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] flex items-center justify-center space-x-2 border border-brand-orange"
          >
            <span>{isProcessing ? 'Procesando...' : '✓ Cobrar Ahora'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default PosCashModal;