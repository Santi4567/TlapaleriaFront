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
  
  // ESCUDO DE MONTAJE: Registramos el milisegundo exacto en que se abrió la ventana
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ANTI-REBOTE Y ESCUDO: Ignoramos teclas mantenidas presionadas o que lleguen en los primeros 150ms
      if (e.repeat || Date.now() - mountTime.current < 150) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % product.presentations.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + product.presentations.length) % product.presentations.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(product.presentations[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, product.presentations, onSelect, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-150">
      {/* CONTENEDOR AMPLIADO A max-w-2xl Y PADDING DE 10 */}
      <div className="max-w-2xl w-full bg-[#121212] rounded-[2rem] border-2 border-brand-orange/60 p-10 shadow-[0_0_60px_rgba(255,90,0,0.25)] space-y-6">
        
        {/* CABECERA AMPLIADA */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-5">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="font-mono font-black text-black bg-brand-orange px-3 py-1 rounded-lg text-sm">
                {product.internalCode}
              </span>
              <span className="text-sm bg-gray-800 text-gray-200 px-3 py-1 rounded-lg font-mono font-bold border border-gray-700">
                Marca: {product.brand || 'N/A'}
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

        {/* INSTRUCCIONES MÁS CLARAS */}
        <div className="flex justify-between items-center bg-brand-orange/10 border border-brand-orange/30 px-5 py-3 rounded-2xl">
          <p className="text-base font-bold text-brand-orange flex items-center">
            <span className="mr-2 text-xl">⚡</span> Selecciona la presentación deseada:
          </p>
          <span className="text-xs font-mono bg-black/60 text-gray-300 px-3 py-1 rounded-xl border border-gray-800 font-bold">
            Usa ↑ ↓ y Enter ↵
          </span>
        </div>

        {/* LISTA DE PRESENTACIONES CON MÁS ALTURA Y ESPACIO */}
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {product.presentations.map((pres, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={pres.id}
                onClick={() => {
                  if (Date.now() - mountTime.current >= 100) onSelect(pres);
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  isSelected 
                    ? 'bg-brand-orange text-black font-black border-brand-orange shadow-[0_0_30px_rgba(255,90,0,0.3)] scale-[1.02]' 
                    : 'bg-[#1a1a1a] text-gray-200 border-gray-800/80 hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm px-3 py-1 rounded-lg font-mono ${isSelected ? 'bg-black text-brand-orange font-black' : 'bg-black/50 text-gray-400 font-bold'}`}>
                      #{idx + 1}
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight">{pres.name}</h4>
                  </div>
                  <p className={`text-sm font-mono mt-1.5 ${isSelected ? 'text-black/80 font-extrabold' : 'text-gray-400'}`}>
                    Código: {pres.code || product.internalCode} | Factor de descarga: <strong className="underline">x{pres.stockFactor}</strong>
                  </p>
                </div>

                <div className="text-right flex items-center space-x-3">
                  <span className="text-3xl font-black font-mono tracking-tight">
                    ${pres.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  {isSelected && (
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
        <div className="pt-2 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500 font-mono">
            Presiona <strong className="text-gray-300">Enter</strong> para agregar al ticket o <strong className="text-gray-300">Esc</strong> para cancelar.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PosPresentationModal;