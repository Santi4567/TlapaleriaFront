// src/components/pos/PosCashModal.tsx
import React, { useState } from 'react';

interface PosCashModalProps {
  totalAmount: number;
  onClose: () => void;
  onConfirm: (receivedAmount: number, change: number) => void;
}

const PosCashModal: React.FC<PosCashModalProps> = ({
  totalAmount,
  onClose,
  onConfirm
}) => {
  const [received, setReceived] = useState<string>('');
  
  const receivedNum = parseFloat(received) || 0;
  const change = Math.max(0, receivedNum - totalAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Permite procesar el cobro libremente sin bloquear
    onConfirm(receivedNum, change);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-8 shadow-[0_0_50px_rgba(255,90,0,0.25)] space-y-6">
        
        <div className="text-center border-b border-gray-800 pb-4">
          <span className="text-3xl">💵</span>
          <h3 className="text-2xl font-black text-white mt-1">Cobro en Efectivo</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Asistente de cálculo de cambio</p>
        </div>

        <div className="space-y-4 font-mono">
          <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-gray-800">
            <span className="text-sm font-bold text-gray-400">Monto a Pagar:</span>
            <span className="text-2xl font-black text-white">
              ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-orange uppercase tracking-widest mb-1.5">
              Efectivo Recibido ($):
            </label>
            <input
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              className="w-full bg-[#1a1a1a] border-2 border-gray-700 focus:border-brand-orange text-white text-3xl font-black rounded-2xl px-5 py-3.5 text-right focus:outline-none transition-all shadow-inner placeholder-gray-600"
            />
            <p className="text-[10px] font-sans text-gray-500 mt-1">* Opcional: Deje en blanco si se recibe el monto exacto.</p>
          </div>

          <div className="flex justify-between items-center bg-brand-orange/10 p-4 rounded-2xl border border-brand-orange/30">
            <span className="text-sm font-bold text-brand-orange">Cambio a Devolver:</span>
            <span className="text-3xl font-black text-brand-orange">
              ${change.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex space-x-3 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-1/2 py-4 bg-brand-orange hover:bg-orange-500 text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] flex items-center justify-center space-x-2"
          >
            <span>✓ Cobrar Ahora</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PosCashModal;