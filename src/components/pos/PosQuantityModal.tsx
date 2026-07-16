// src/components/pos/PosQuantityModal.tsx
import React, { useState } from 'react';
import { Product, ProductPresentation } from '../../types/product';

interface PosQuantityModalProps {
  product: Product;
  presentation: ProductPresentation;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const PosQuantityModal: React.FC<PosQuantityModalProps> = ({
  product,
  presentation,
  onClose,
  onConfirm
}) => {
  const [qty, setQty] = useState<string>('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(qty);
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-sm w-full bg-[#121212] rounded-3xl border border-gray-800 p-6 shadow-2xl text-center">
        <h3 className="text-lg font-extrabold text-white truncate">{product.name}</h3>
        <p className="text-sm font-bold text-brand-orange mt-0.5 bg-brand-orange/10 py-1 px-3 rounded-full inline-block border border-brand-orange/20">
          {presentation.name} — ${presentation.price}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              ¿Qué cantidad deseas agregar?
            </label>
            <input
              type="number"
              step="any"
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onFocus={(e) => e.target.select()} // Seleccionar el 1 inicial al abrir
              className="w-full bg-[#1a1a1a] border-2 border-brand-orange text-white text-4xl font-mono font-black rounded-2xl py-4 text-center focus:outline-none shadow-[0_0_20px_rgba(255,90,0,0.15)]"
            />
            <p className="text-[10px] text-gray-500 mt-2 font-mono">Presiona ENTER para confirmar</p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-brand-orange hover:bg-orange-600 text-black font-black rounded-xl text-sm shadow-lg"
            >
              Confirmar ↵
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosQuantityModal;