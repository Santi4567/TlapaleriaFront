// src/components/pos/PosPresentationModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductPresentation } from '../../types/product';

interface PosPresentationModalProps {
  product: Product;
  onClose: () => void;
  onSelect: (presentation: ProductPresentation) => void;
}

const PosPresentationModal: React.FC<PosPresentationModalProps> = ({
  product,
  onClose,
  onSelect
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mountTime = useRef(Date.now());

  // REGLA DE INVENTARIO Y FRACCIONES:
  const canSellPresentation = (pres: ProductPresentation) => {
    // 1. Si NO se rastrea inventario, siempre se puede vender libremente
    if (product.isInventoryTracked === false) return true;

    // 2. Si SÍ se rastrea inventario:
    // - Si el empaque es cerrado (factor > 1), obligamos a que alcance para al menos 1 entero.
    // - Si es granel (factor <= 1), basta con tener existencias positivas (> 0).
    if (pres.stockFactor > 1) {
      return product.currentStock >= pres.stockFactor;
    }
    return product.currentStock > 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || Date.now() - mountTime.current < 150) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % product.presentations.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + product.presentations.length) % product.presentations.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedPres = product.presentations[selectedIndex];
        if (selectedPres && canSellPresentation(selectedPres)) {
          onSelect(selectedPres);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, product.presentations, onSelect, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-150">
      <div className="max-w-2xl w-full bg-[#121212] rounded-[2rem] border-2 border-brand-orange/60 p-10 shadow-[0_0_60px_rgba(255,90,0,0.25)] space-y-6">
        
        {/* CABECERA */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-5">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="font-mono font-black text-black bg-brand-orange px-3 py-1 rounded-lg text-sm">
                {product.internalCode}
              </span>
              <span className={`text-sm px-3 py-1 rounded-lg font-mono font-bold border ${
                product.isInventoryTracked === false 
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' 
                  : 'bg-gray-800 text-gray-200 border-gray-700'
              }`}>
                {product.isInventoryTracked === false ? '♾️ Venta Libre (Sin stock)' : `Existencias: ${product.currentStock} ${product.unitOfMeasure}`}
              </span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">{product.name}</h3>
          </div>
          
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-white font-black p-3 bg-gray-800/80 rounded-2xl hover:bg-gray-700 transition-colors text-base flex items-center space-x-1"
          >
            <span>✕</span>
            <kbd className="text-[10px] bg-black/50 px-1.5 py-0.5 rounded font-mono text-gray-400">Esc</kbd>
          </button>
        </div>

        {/* INSTRUCCIONES */}
        <div className="flex justify-between items-center bg-brand-orange/10 border border-brand-orange/30 px-5 py-3 rounded-2xl">
          <p className="text-base font-bold text-brand-orange flex items-center">
            <span className="mr-2 text-xl">⚡</span> Selecciona la presentación deseada:
          </p>
          <span className="text-xs font-mono bg-black/60 text-gray-300 px-3 py-1 rounded-xl border border-gray-800 font-bold">
            Usa ↑ ↓ y Enter ↵
          </span>
        </div>

        {/* LISTA DE PRESENTACIONES */}
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {product.presentations.map((pres, idx) => {
            const isSelected = idx === selectedIndex;
            const canSell = canSellPresentation(pres);
            
            // Si se rastrea, calculamos tope. Si no, le damos infinito (999999)
            const maxUnits = product.isInventoryTracked === false 
              ? 999999 
              : parseFloat((product.currentStock / pres.stockFactor).toFixed(2));

            return (
              <div
                key={pres.id}
                onClick={() => {
                  if (Date.now() - mountTime.current >= 100 && canSell) {
                    onSelect(pres);
                  }
                }}
                className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  !canSell 
                    ? 'bg-black/40 border-red-900/40 opacity-50 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-brand-orange text-black font-black border-brand-orange shadow-[0_0_30px_rgba(255,90,0,0.3)] scale-[1.02] cursor-pointer' 
                      : 'bg-[#1a1a1a] text-gray-200 border-gray-800/80 hover:bg-gray-800 hover:border-gray-700 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm px-3 py-1 rounded-lg font-mono ${
                      !canSell ? 'bg-red-500/20 text-red-400 font-bold' : isSelected ? 'bg-black text-brand-orange font-black' : 'bg-black/50 text-gray-400 font-bold'
                    }`}>
                      #{idx + 1}
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight flex items-center space-x-2">
                      <span>{pres.name}</span>
                      {!canSell && <span className="text-base" title="Sin existencias suficientes en almacén">🔒</span>}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-1.5 font-mono text-sm">
                    <span className={!canSell ? 'text-red-400 font-bold' : isSelected ? 'text-black/80 font-extrabold' : 'text-gray-400'}>
                      Factor: x{pres.stockFactor} {product.unitOfMeasure}
                    </span>
                    
                    {!canSell ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-black border border-red-500/30">
                        🚫 Req. {pres.stockFactor} / Hay {product.currentStock}
                      </span>
                    ) : product.isInventoryTracked === false ? (
                      <span className={`text-xs ${isSelected ? 'text-black font-extrabold' : 'text-blue-400'}`}>
                        (Disponible)
                      </span>
                    ) : (
                      <span className={`text-xs ${isSelected ? 'text-black font-extrabold' : 'text-green-400'}`}>
                        (Máx: {maxUnits} u.)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex items-center space-x-3">
                  <span className="text-3xl font-black font-mono tracking-tight">
                    ${pres.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  {isSelected && canSell && (
                    <kbd className="bg-black/80 text-brand-orange px-3 py-1 rounded-xl font-mono text-sm font-black shadow-inner border border-brand-orange/40">
                      ↵
                    </kbd>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* PIE DEL MODAL */}
        <div className="pt-2 border-t border-gray-800 text-center flex justify-between items-center text-xs text-gray-500 font-mono px-2">
          <span>{product.allowFractions === false ? '🔒 Solo permite números enteros' : '⚖️ Soporta fracciones decimales'}</span>
          <span>Presiona <strong className="text-gray-300">Enter</strong> para elegir.</span>
        </div>

      </div>
    </div>
  );
};

export default PosPresentationModal;