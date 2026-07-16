// src/components/pos/PosPresentationModal.tsx
import React, { useState, useEffect } from 'react';
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

  // Escuchar teclado para navegar con flechas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-lg w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/50 p-6 shadow-[0_0_40px_rgba(255,90,0,0.2)]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-xl font-extrabold text-white">{product.name}</h3>
            <p className="text-xs text-gray-400 font-mono">SKU Base: {product.internalCode} | Marca: {product.brand || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold px-2 py-1 bg-gray-800 rounded-lg">✕</button>
        </div>

        <p className="text-sm font-bold text-brand-orange mb-3 flex items-center">
          <span className="mr-2">⚡</span> Selecciona la presentación (Usa ↑ ↓ y Enter):
        </p>

        <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {product.presentations.map((pres, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={pres.id}
                onClick={() => onSelect(pres)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected 
                    ? 'bg-brand-orange text-black font-extrabold border-brand-orange shadow-lg scale-[1.02]' 
                    : 'bg-[#1a1a1a] text-gray-300 border-gray-800 hover:bg-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${isSelected ? 'bg-black text-brand-orange font-black' : 'bg-black/40 text-gray-400'}`}>
                      #{idx + 1}
                    </span>
                    <h4 className="text-base font-bold">{pres.name}</h4>
                  </div>
                  <p className={`text-xs font-mono mt-1 ${isSelected ? 'text-black/80 font-bold' : 'text-gray-500'}`}>
                    Código: {pres.code || product.internalCode} | Factor: x{pres.stockFactor}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black font-mono">
                    ${pres.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PosPresentationModal;