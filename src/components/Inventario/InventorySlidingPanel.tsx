// src/components/Inventario/InventorySlidingPanel.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../../types/product';
import InventoryKardexTable from './InventoryKardexTable'; 

interface InventorySlidingPanelProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (movementType: 1 | 2, quantity: number, notes: string) => void;
  onError: (msg: string) => void;
  isProcessing: boolean;
}

const InventorySlidingPanel: React.FC<InventorySlidingPanelProps> = ({ 
  isOpen, product, onClose, onSubmit, onError, isProcessing
}) => {
  const [movementType, setMovementType] = useState<1 | 2>(1);
  const [quantity, setQuantity] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    setMovementType(1);
    setQuantity('');
    setNotes('');
  }, [product]);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      return onError("La cantidad debe ser mayor a 0.");
    }
    
    // Doble validación de seguridad antes de enviar
    const finalQuantity = Number(quantity);
    if (!product.allowFractions && !Number.isInteger(finalQuantity)) {
      return onError("Este producto no admite fracciones/decimales.");
    }

    if (!notes.trim()) {
      return onError("El motivo del ajuste es obligatorio.");
    }
    
    onSubmit(movementType, finalQuantity, notes);
  };

  // NUEVO: Bloqueo estricto de teclas en tiempo real
  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Siempre bloqueamos la letra 'e', 'E', '+' y '-' porque es un ajuste de cantidad absoluto
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }

    // Si NO permite fracciones, bloqueamos también el punto y la coma
    if (!product.allowFractions) {
      if (e.key === '.' || e.key === ',') {
        e.preventDefault();
      }
    }
  };

  return (
    <div 
      className={`absolute inset-0 bg-[#161616] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-40 flex flex-col transform-gpu transition-transform duration-300 ease-out will-change-transform
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#121212] rounded-t-3xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-brand-orange text-white rounded-xl transition-colors font-bold text-xl"
          >
            ←
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Ajuste de Inventario</h2>
            <p className="text-brand-orange font-mono text-sm mt-1">{product.internalCode} - {product.name}</p>
          </div>
        </div>
        <div className="text-sm px-4 py-2 bg-black rounded-xl border border-gray-800">
          Stock Actual: <span className="text-brand-orange font-bold text-xl ml-2">{product.currentStock} {product.unitOfMeasure}</span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col md:flex-row gap-6">
        
        {/* FORMULARIO */}
        <div className="w-full md:w-1/3 bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">Registrar Movimiento</h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">TIPO DE MOVIMIENTO</label>
              <div className="flex bg-[#121212] rounded-xl p-1 border border-gray-800">
                <button
                  type="button"
                  onClick={() => setMovementType(1)}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${movementType === 1 ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  + Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType(2)}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${movementType === 2 ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  - Salida
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                CANTIDAD ({product.allowFractions ? 'Admite Decimales' : 'Solo Enteros'})
              </label>
              {/* INPUT ACTUALIZADO CON onKeyDown */}
              <input 
                type="number"
                step={product.allowFractions ? "0.01" : "1"}
                min={product.allowFractions ? "0.01" : "1"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={handleQuantityKeyDown}
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-4 text-white text-xl font-bold outline-none focus:border-brand-orange transition-colors"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">MOTIVO (OBLIGATORIO)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-orange transition-colors resize-none h-28 text-sm"
                placeholder="Ej. Compra a proveedor, producto dañado, ajuste por inventario..."
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 mt-2 rounded-xl text-white font-bold text-lg transition-colors shadow-lg ${
                isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-brand-orange hover:bg-orange-600'
              }`}
            >
              {isProcessing ? 'Procesando...' : 'Guardar Movimiento'}
            </button>
          </form>
        </div>

        {/* KARDEX */}
        <InventoryKardexTable product={product} />

      </div>
    </div>
  );
};

export default InventorySlidingPanel;