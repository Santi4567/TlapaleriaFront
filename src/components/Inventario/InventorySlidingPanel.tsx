// src/components/Inventario/InventorySlidingPanel.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../../types/product';
import InventoryKardexTable from './InventoryKardexTable';

interface InventorySlidingPanelProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (movementType: 1 | 2 | 3 | 4, quantity: number, notes: string) => void;
  onError: (msg: string) => void;
  isProcessing: boolean;
  refreshTrigger: number; 
}

const InventorySlidingPanel: React.FC<InventorySlidingPanelProps> = ({ 
  isOpen, product, onClose, onSubmit, onError, isProcessing, refreshTrigger
}) => {
  const [showForm, setShowForm] = useState(false);

  const [movementType, setMovementType] = useState<1 | 2 | 3 | 4>(1);
  const [quantity, setQuantity] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    setMovementType(1);
    setQuantity('');
    setNotes('');
    setShowForm(false); 
  }, [product]);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) return onError("La cantidad debe ser mayor a 0.");
    
    const finalQuantity = Number(quantity);
    if (!product.allowFractions && !Number.isInteger(finalQuantity)) {
      return onError("Este producto no admite fracciones/decimales.");
    }

    if (!notes.trim()) return onError("El motivo del ajuste es obligatorio.");
    
    onSubmit(movementType, finalQuantity, notes);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
    if (!product.allowFractions && (e.key === '.' || e.key === ',')) e.preventDefault();
  };

  return (
    <div 
      className={`absolute inset-0 bg-[#161616] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-40 flex flex-col transform-gpu transition-transform duration-300 ease-out will-change-transform
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#121212] rounded-t-3xl z-20 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-red-500 text-white rounded-xl transition-colors font-bold text-xl"
          >
            ←
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Auditoría y Ajustes</h2>
            <p className="text-brand-orange font-mono text-sm mt-1">{product.internalCode} - {product.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm px-4 py-2 bg-black rounded-xl border border-gray-800 hidden md:block">
            Stock Actual: <span className="text-brand-orange font-bold text-xl ml-2">{product.currentStock} {product.unitOfMeasure}</span>
          </div>
          {/* BOTÓN PARA ABRIR FORMULARIO */}
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center gap-2 relative z-50
              ${showForm ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-brand-orange hover:bg-orange-600 text-white'}`}
          >
            {showForm ? '✖ Cancelar Ajuste' : '➕ Agregar Movimiento'}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL RELATIVO PARA POSICIONAMIENTO ABSOLUTO */}
      <div className="flex-1 overflow-hidden p-6 relative flex">
        
        {/* =========================================================
            FORMULARIO FLOTANTE (Optimizado para GPU)
            Usamos absolute y translate-x en lugar de cambiar anchos.
            ========================================================= */}
        <div 
          className={`absolute top-6 bottom-6 left-6 z-30 transform-gpu transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${showForm ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-[110%] opacity-0 pointer-events-none'}`}
        >
          <div className="w-[360px] bg-[#1c1c1c]/95 backdrop-blur-md p-6 rounded-2xl border-2 border-brand-orange/50 h-full overflow-y-auto custom-scrollbar shadow-[20px_0_30px_-15px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-white mb-6">Nuevo Registro</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-2 tracking-wider uppercase">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2 bg-[#121212] rounded-xl p-2 border border-gray-800">
                  <button type="button" onClick={() => setMovementType(1)} className={`py-2 text-xs font-bold rounded-lg transition-colors ${movementType === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}>+ Entrada (1)</button>
                  <button type="button" onClick={() => setMovementType(3)} className={`py-2 text-xs font-bold rounded-lg transition-colors ${movementType === 3 ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}>+ Ajuste Pos. (3)</button>
                  <button type="button" onClick={() => setMovementType(2)} className={`py-2 text-xs font-bold rounded-lg transition-colors ${movementType === 2 ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}>- Merma (2)</button>
                  <button type="button" onClick={() => setMovementType(4)} className={`py-2 text-xs font-bold rounded-lg transition-colors ${movementType === 4 ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}>- Ajuste Neg. (4)</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-2 tracking-wider uppercase">Cantidad ({product.allowFractions ? 'Decimales' : 'Enteros'})</label>
                <input type="number" step={product.allowFractions ? "0.01" : "1"} min={product.allowFractions ? "0.01" : "1"} value={quantity} onChange={(e) => setQuantity(e.target.value)} onKeyDown={handleQuantityKeyDown} className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold outline-none focus:border-brand-orange transition-colors" placeholder="0" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-2 tracking-wider uppercase">Motivo</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-orange transition-colors resize-none h-24 text-sm" placeholder="Especifica la razón del movimiento..." required />
              </div>

              <button type="submit" disabled={isProcessing} className={`w-full py-3 mt-4 rounded-xl text-white font-bold text-lg transition-colors shadow-lg ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-brand-orange hover:bg-orange-600'}`}>
                {isProcessing ? 'Guardando...' : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>

        {/* =========================================================
            KARDEX DE FONDO
            Ocupa siempre todo el espacio disponible. No se traba porque no se redimensiona.
            ========================================================= */}
        <div className="w-full h-full relative">
           {/* Pequeño velo oscuro opcional que resalta el formulario cuando está abierto */}
           <div 
             className={`absolute inset-0 bg-black/40 z-20 rounded-2xl transition-opacity duration-300 pointer-events-none
             ${showForm ? 'opacity-100' : 'opacity-0'}`} 
           />
           <InventoryKardexTable product={product} refreshTrigger={refreshTrigger} />
        </div>

      </div>
    </div>
  );
};

export default InventorySlidingPanel;