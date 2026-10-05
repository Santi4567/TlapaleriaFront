// src/components/ProductHistory/ProductInformation.tsx
import React, { useRef, useEffect } from 'react';
import { Product, ProductPresentation } from '../../types/product';

interface Props {
  product: Product;
  selectedPresentation: ProductPresentation | null;
  onSelectPresentation: (presentation: ProductPresentation) => void;
}

const ProductInformation: React.FC<Props> = ({ product, selectedPresentation, onSelectPresentation }) => {
  // 1. Ref para el contenedor con scroll
  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. Fix del ResizeObserver para el scroll atascado al redimensionar[cite: 8]
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const fixStuckScroll = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollTop > maxScroll) {
        el.scrollTop = Math.max(0, maxScroll);
      }
    };

    const ro = new ResizeObserver(fixStuckScroll);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-2xl font-extrabold text-white mb-3 leading-tight">{product.name}</h3>
      
      {/* Metadatos del producto basados en la API */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-5 border-b border-gray-800 pb-4 shrink-0">
        <p className="text-gray-500">SKU: <span className="text-gray-300 font-semibold">{product.internalCode}</span></p>
        {product.barcode && <p className="text-gray-500">C.B: <span className="text-gray-300 font-semibold">{product.barcode}</span></p>}
        <p className="text-gray-500">Marca: <span className="text-gray-300 font-semibold">{product.brand || 'N/A'}</span></p>
        <p className="text-gray-500">Stock: <span className="text-brand-orange font-bold">{product.currentStock}</span></p>
      </div>

      {/* PRECIOS ACTUALES DE LA PRESENTACIÓN SELECCIONADA */}
      {selectedPresentation && (
        <div className="bg-black/30 border border-gray-700 rounded-xl p-4 mb-6 relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-orange/10 blur-2xl rounded-full"></div>
          
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-bold">
            Precios Actuales ({selectedPresentation.name})
          </p>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs text-gray-400 mb-1">Costo Proveedor</p>
              <p className="text-xl font-bold text-gray-300">${selectedPresentation.supplierPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Precio Público</p>
              <p className="text-3xl font-black text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                ${selectedPresentation.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <h4 className="text-brand-orange font-bold text-sm mb-3 uppercase tracking-wider shrink-0">
        Selector de Presentaciones ({product.presentations.length})
      </h4>
      
      {/* 3. Asignación del ref y overflow-x-hidden[cite: 8] */}
      <div 
        ref={scrollRef}
        className="space-y-3 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar flex-1 min-h-0"
      >
        {product.presentations.map((pres) => {
          const isSelected = selectedPresentation?.id === pres.id;
          return (
            <div 
              key={pres.id} 
              onClick={() => onSelectPresentation(pres)}
              // 4. Regla de oro: shrink-0 y transition-colors duration-200 (se quita transition-all y transformaciones que rompan el layout)[cite: 8]
              className={`cursor-pointer transition-colors duration-200 rounded-xl p-4 border flex flex-col justify-between shrink-0 ${
                isSelected 
                  ? 'bg-[#1e2329] border-brand-orange shadow-[0_0_15px_rgba(255,107,0,0.15)] text-white' 
                  : 'bg-[#111111] border-gray-800 hover:border-gray-500 hover:bg-[#1a1a1a] text-gray-400'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className={`font-semibold text-sm leading-snug pr-2 ${isSelected ? 'text-brand-orange' : 'text-gray-300'}`}>
                  {pres.name}
                </p>
                {isSelected && (
                  <span className="flex h-3 w-3 relative flex-shrink-0 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-end text-sm mt-2">
                <span className="text-gray-500 text-xs font-mono border border-gray-800 px-2 py-0.5 rounded">
                  Factor: x{pres.stockFactor}
                </span>
                <span className={`font-bold ${isSelected ? 'text-green-500' : 'text-gray-500'}`}>
                  ${pres.price.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductInformation;