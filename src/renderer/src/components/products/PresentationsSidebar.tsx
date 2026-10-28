// src/components/products/PresentationsSidebar.tsx
import React from 'react';
import { CreatePresentationRequest } from '../../types/product';

interface PresentationsSidebarProps {
  baseProduct: any;
  presentations: CreatePresentationRequest[];
  maxStockFactor: number;
  onSelectBase: () => void;
  onToggleBaseActive: () => void;
  onSelectVariant: (idx: number) => void;
  onToggleVariantActive: (idx: number) => void;
  onDeleteVariant: (idx: number) => void;
}

const PresentationsSidebar: React.FC<PresentationsSidebarProps> = ({
  baseProduct,
  presentations,
  maxStockFactor,
  onSelectBase,
  onToggleBaseActive,
  onSelectVariant,
  onToggleVariantActive,
  onDeleteVariant
}) => {
  const baseFactor = Number(baseProduct.baseStockFactor) || 1;
  const isBaseLargest = presentations.length > 0 && baseFactor >= maxStockFactor;
  const isBaseActive = baseProduct.baseIsActive !== false;

  return (
    <div className="w-full xl:w-80 flex-shrink-0">
      <div className="sticky top-0 space-y-4">
        <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-4">
          Jerarquía de Presentaciones
        </h3>

        {/* TARJETA 1: PRESENTACIÓN BASE */}
        <div
          onClick={onSelectBase}
          className={`cursor-pointer p-4 rounded-2xl transition-all shadow-md group relative border ${
            isBaseActive
              ? 'bg-brand-orange/10 border-brand-orange/40 hover:bg-brand-orange/20'
              : 'bg-black/40 border-gray-800 opacity-75 hover:opacity-100'
          }`}
        >
          <div className="flex justify-between items-start gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-brand-orange font-extrabold bg-black/50 px-2 py-0.5 rounded uppercase">
                1. Base
              </span>
              {isBaseLargest && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 font-extrabold px-2 py-0.5 rounded">
                  ★ MAYOR
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBaseActive();
              }}
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded border transition-colors ${
                isBaseActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-yellow-500/20 hover:text-yellow-300'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-green-500/20 hover:text-green-400'
              }`}
              title="Clic para activar o desactivar su venta en mostrador"
            >
              {isBaseActive ? '✓ En Venta' : '🔒 Solo Compra'}
            </button>
          </div>

          <p className="font-extrabold text-white text-base truncate mt-2">
            {(presentations.length > 0 && baseProduct.basePresentationName)
              ? baseProduct.basePresentationName
              : (baseProduct.name || 'Sin Nombre')}
          </p>

          <div className="flex justify-between items-end mt-3">
            <div>
              {isBaseActive ? (
                <p className="text-2xl font-black font-mono text-brand-orange">
                  ${baseProduct.baseSalePrice || '0'}
                </p>
              ) : (
                <p className="text-xs font-bold text-yellow-400/90">
                  No se vende en caja
                </p>
              )}
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                Costo: ${baseProduct.supplierPrice || '0'}
              </p>
            </div>
            <p className="text-xs text-brand-orange/90 font-bold bg-black/40 px-2 py-1 rounded font-mono">
              Factor: x{baseProduct.baseStockFactor || '1'}
            </p>
          </div>
        </div>

        {/* TARJETAS HIJAS (VARIANTES) */}
        {presentations.map((p, idx) => {
          const isVariantActive = p.isActive !== false;
          const isLargest = Number(p.stockFactor) >= maxStockFactor && !isBaseLargest;
          const ganancia = p.supplierPrice > 0 && p.price > 0
            ? (((p.price - p.supplierPrice) / p.supplierPrice) * 100).toFixed(0)
            : null;

          return (
            <div
              key={idx}
              onClick={() => onSelectVariant(idx)}
              className={`cursor-pointer p-4 rounded-2xl transition-all shadow-sm group relative border ${
                isVariantActive
                  ? 'bg-[#121212] border-gray-700 hover:border-gray-500'
                  : 'bg-black/40 border-gray-800/80 opacity-65 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {idx + 2}. Variante
                  </p>
                  {isLargest && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 font-extrabold px-2 py-0.5 rounded">
                      ★ MAYOR
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVariantActive(idx);
                    }}
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded border transition-colors ${
                      isVariantActive
                        ? 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-gray-700 hover:text-gray-300'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-green-500/20 hover:text-green-400'
                    }`}
                    title={isVariantActive ? "Clic para desactivar esta presentación" : "Clic para reactivar esta presentación"}
                  >
                    {isVariantActive ? '✓ Activa' : '🚫 Inactiva'}
                  </button>

                  {(!p.id || p.id === 0) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteVariant(idx);
                      }}
                      className="text-gray-500 hover:text-red-500 transition-all p-0.5 text-xs"
                      title="Quitar variante nueva"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <p className={`font-extrabold text-md truncate mt-1 ${isVariantActive ? 'text-white' : 'text-gray-400 line-through'}`}>
                {p.name}
              </p>

              <div className="flex justify-between items-end mt-2">
                <div>
                  {isVariantActive ? (
                    <p className="text-xl font-black font-mono text-white">${p.price}</p>
                  ) : (
                    <p className="text-xs font-bold text-gray-500">Inactiva en caja ($0)</p>
                  )}
                  <p className="text-[11px] text-gray-400 font-mono">Costo: ${p.supplierPrice}</p>
                </div>
                <p className="text-xs text-gray-400 font-bold bg-black/40 px-2 py-1 rounded font-mono">
                  Factor: x{p.stockFactor}
                </p>
              </div>

              {isVariantActive && ganancia !== null && (
                <p className={`text-[10px] font-bold mt-1 ${Number(ganancia) < 15 ? 'text-red-400' : 'text-green-400'}`}>
                  Ganancia s/costo: +{ganancia}%
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