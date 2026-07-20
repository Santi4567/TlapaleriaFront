// src/components/pos/PosQuantityModal.tsx
import React, { useState, useRef } from 'react';
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
  
  // ESCUDO DE MONTAJE ANTI-ENTER FANTASMA (150ms)
  const mountTime = useRef(Date.now());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() - mountTime.current < 150) return;

    const parsed = parseFloat(qty);
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-150">
      {/* CONTENEDOR AMPLIADO A max-w-lg CON PADDING GIGANTE p-10 */}
      <div className="max-w-lg w-full bg-[#121212] rounded-[2rem] border-2 border-brand-orange/60 p-10 shadow-[0_0_60px_rgba(255,90,0,0.25)] text-center space-y-8">
        
        {/* ENCABEZADO Y DETALLES DEL PRODUCTO */}
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
            Definir Cantidad
          </span>
          <h3 className="text-2xl font-black text-white leading-tight">{product.name}</h3>
          
          <div className="mt-3 inline-flex items-center space-x-2 bg-brand-orange/15 border-2 border-brand-orange/40 py-2 px-5 rounded-2xl">
            <span className="text-base font-extrabold text-brand-orange">{presentation.name}</span>
            <span className="text-gray-500 font-bold">|</span>
            <span className="text-lg font-black font-mono text-white">
              ${presentation.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* FORMULARIO DE CANTIDAD CON INPUT GIGANTE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-black/50 p-6 rounded-3xl border border-gray-800">
            <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
              ¿Cuántas unidades se lleva el cliente?
            </label>
            
            <input
              type="number"
              step="any"
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-[#1a1a1a] border-2 border-brand-orange text-white text-6xl font-mono font-black rounded-3xl py-6 text-center focus:outline-none shadow-[0_0_30px_rgba(255,90,0,0.2)] transition-all"
            />
            
            <p className="text-xs text-gray-400 mt-3 font-mono flex items-center justify-center space-x-1.5">
              <span>💡 Factor de inventario:</span>
              <strong className="text-brand-orange">x{presentation.stockFactor}</strong>
            </p>
          </div>

          {/* BOTONES DE ACCIÓN AMPLIADOS */}
          <div className="flex space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-base transition-colors flex items-center justify-center space-x-2"
            >
              <span>Cancelar</span>
              <kbd className="bg-black/50 text-gray-400 px-2 py-0.5 rounded font-mono text-xs font-black">Esc</kbd>
            </button>
            
            <button
              type="submit"
              className="w-1/2 py-5 bg-brand-orange hover:bg-orange-500 text-black font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(255,90,0,0.3)] transition-all flex items-center justify-center space-x-2 border-2 border-brand-orange"
            >
              <span>Confirmar</span>
              <kbd className="bg-black/80 text-brand-orange px-2.5 py-0.5 rounded-lg font-mono text-xs font-black shadow-inner border border-brand-orange/40">Enter ↵</kbd>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PosQuantityModal;