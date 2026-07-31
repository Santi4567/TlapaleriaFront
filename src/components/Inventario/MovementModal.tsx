// src/components/Inventario/MovementModal.tsx
import React, { useState } from 'react';
import { Product } from '../../types/product';

interface MovementModalProps {
  product: Product;
  type: 1 | 2; // 1: Aumento, 2: Decremento
  onClose: () => void;
  onSubmit: (quantity: number, notes: string) => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({ product, type, onClose, onSubmit }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  
  const isIncrease = type === 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(quantity, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">
          {isIncrease ? 'Aumentar Stock' : 'Disminuir Stock'}
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          Producto: <span className="text-white font-semibold">{product.internalCode} - {product.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">CANTIDAD</label>
            <input 
              type="number" 
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">NOTAS / MOTIVO</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-orange-500 transition-colors resize-none h-24"
              placeholder={isIncrease ? "Ej. Compra a proveedor..." : "Ej. Producto dañado..."}
              required
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-gray-400 border border-gray-800 hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition-colors ${
                isIncrease ? 'bg-orange-600 hover:bg-orange-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};