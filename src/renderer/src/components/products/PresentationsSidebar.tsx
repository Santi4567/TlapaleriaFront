// src/components/products/PresentationsSidebar.tsx
import React from 'react';
import { CreatePresentationRequest } from '../../types/product';

interface PresentationsSidebarProps {
  baseProduct: any;
  presentations: CreatePresentationRequest[];
  onSelectBase: () => void;
  onSelectVariant: (idx: number) => void;
  onDeleteVariant: (idx: number) => void;
}

const PresentationsSidebar: React.FC<PresentationsSidebarProps> = ({
  baseProduct,
  presentations,
  onSelectBase,
  onSelectVariant,
  onDeleteVariant
}) => {
  return (
    <div className="w-full xl:w-80 flex-shrink-0">
      <div className="sticky top-0 space-y-4">
        <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-4">Resumen de Ventas</h3>

        <div
          onClick={onSelectBase}
          className="cursor-pointer p-4 bg-brand-orange/10 border border-brand-orange/40 rounded-2xl hover:bg-brand-orange/20 transition-all shadow-md group relative"
        >
          <div className="flex justify-between items-start mb-1">
            <p className="font-extrabold text-white text-lg truncate mt-2">
            {(presentations.length > 0 && baseProduct.basePresentationName)
              ? baseProduct.basePresentationName
              : (baseProduct.name || 'Sin Nombre')}
          </p>
            <span className="text-[10px] text-brand-orange/80 font-semibold bg-black/40 px-2 py-0.5 rounded">
              Inamovible
            </span>
          </div>
          <div className="flex justify-between items-end mt-3">
            <p className="text-3xl font-black font-mono text-brand-orange">${baseProduct.baseSalePrice || '0'}</p>
            <p className="text-xs text-brand-orange/80 font-bold bg-black/40 px-2 py-1 rounded">
              Factor: x{baseProduct.baseStockFactor || '1'}
            </p>
          </div>
        </div>

        {presentations.map((p, idx) => {
          const margen = p.supplierPrice > 0 && p.price > 0
            ? (((p.price - p.supplierPrice) / p.price) * 100).toFixed(0)
            : null;
          return (
            <div
              key={idx}
              onClick={() => onSelectVariant(idx)}
              className="cursor-pointer p-4 bg-[#121212] border border-gray-700 rounded-2xl hover:border-gray-500 transition-all shadow-sm group relative"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{idx + 2}. Variante</p>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✎ Editar</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteVariant(idx);
                    }}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                    title="Eliminar esta presentación"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="font-extrabold text-white text-md truncate mt-1">{p.name}</p>
              <div className="flex justify-between items-end mt-2">
                <p className="text-xl font-black font-mono text-white">${p.price}</p>
                <p className="text-xs text-gray-400 font-bold bg-black/40 px-2 py-1 rounded">Factor: x{p.stockFactor}</p>
              </div>
              {margen !== null && (
                <p className={`text-[10px] font-bold mt-1 ${Number(margen) < 15 ? 'text-red-400' : 'text-green-400'}`}>
                  Margen: {margen}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresentationsSidebar;