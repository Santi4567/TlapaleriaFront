// src/components/pos/PosSearchBar.tsx
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { usePosSearch } from '../../hooks/usePosSearch';
import { Product } from '../../types/product';

interface PosSearchBarProps {
  onSelectProduct: (product: Product) => void;
  onShowInfo: (product: Product) => void;
}

const PosSearchBar = forwardRef<HTMLInputElement, PosSearchBarProps>(
  ({ onSelectProduct, onShowInfo }, ref) => {
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    // Referencia al contenedor completo (input + lista) para detectar clics fuera
    const containerRef = useRef<HTMLDivElement>(null);
    const resultsItemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const { searchTerm, setSearchTerm, results, isLoading, handleSelect } = usePosSearch((prod) => {
      setIsDropdownOpen(false);
      onSelectProduct(prod);
    });

    // Formateador de moneda para mostrar solo el precio limpio
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    // Detectar clic fuera del buscador para ocultar la lista
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cuando llegan nuevos resultados, reseteamos al índice 0 y abrimos la lista
    useEffect(() => {
      setHighlightedIndex(0);
      resultsItemRefs.current = [];
      if (results.length > 0) {
        setIsDropdownOpen(true);
      }
    }, [results]);

    // Auto-scroll cuando navegas con las flechas
    useEffect(() => {
      if (!isDropdownOpen) return;
      const activeElement = resultsItemRefs.current[highlightedIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }, [highlightedIndex, isDropdownOpen]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir ocultar la lista con Escape
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        return;
      }

      if (results.length === 0) return;

      // Si estaba cerrada pero presionan flecha abajo/arriba, la reabrimos
      if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        setIsDropdownOpen(true);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
      } else if (e.key.toLowerCase() === 'i' && (e.altKey || e.ctrlKey)) {
        e.preventDefault();
        if (results[highlightedIndex]) {
          setIsDropdownOpen(false);
          onShowInfo(results[highlightedIndex]);
        }
      }
    };

    return (
      <div ref={containerRef} className="relative mb-6 flex-shrink-0">
        <div className="relative">
          <input
            ref={ref}
            type="text"
            value={searchTerm}
            onFocus={() => {
              if (results.length > 0) setIsDropdownOpen(true);
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="🔍 Escanea código de barras o busca por nombre (Ej. Cemento, THW, Valvula)..."
            className="w-full bg-[#121212] border-2 border-gray-800 text-white text-xl rounded-3xl pl-6 pr-32 py-4.5 font-bold focus:outline-none focus:border-brand-orange transition-all placeholder-gray-500 shadow-inner"
          />

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:inline">
              Atajo:
            </span>
            <kbd className="bg-gray-800 text-brand-orange px-3 py-1.5 rounded-xl text-sm font-mono font-black border-2 border-gray-700 shadow-md">
              F3
            </kbd>
          </div>

          {isLoading && (
            <div className="absolute right-32 top-1/2 -translate-y-1/2 text-brand-orange animate-spin font-black text-2xl">
              ↻
            </div>
          )}
        </div>

        {/* LISTA DESPLEGABLE DE RESULTADOS (Solo se muestra si isDropdownOpen es true) */}
        {isDropdownOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-3 bg-[#121212] border-2 border-brand-orange/60 rounded-3xl shadow-2xl z-40 max-h-96 overflow-y-auto custom-scrollbar divide-y divide-gray-800/80">
            {results.map((prod, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const hasSinglePresentation = prod.presentations && prod.presentations.length === 1;
              const singlePresentation = hasSinglePresentation ? prod.presentations[0] : null;

              return (
                <div
                  key={prod.id}
                  ref={(el) => {
                    resultsItemRefs.current[idx] = el;
                  }}
                  onClick={() => handleSelect(prod)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-5 cursor-pointer flex justify-between items-center transition-all ${
                    isHighlighted
                      ? 'bg-gray-800/90 border-l-8 border-brand-orange pl-4 shadow-md'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  {/* IZQUIERDA: Código + Nombre + MARCA DESTACADA + Ubicación/Stock */}
                  <div className="flex-1 pr-6 min-w-0">
                    <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                      <span className="font-mono font-black text-brand-orange bg-black/60 px-2.5 py-1 rounded-lg text-sm border border-gray-800 flex-shrink-0">
                        {prod.internalCode}
                      </span>

                      <h4 className="font-extrabold text-white text-lg truncate">
                        {prod.name}
                      </h4>

                      {prod.brand && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm flex-shrink-0">
                          🏷️ {prod.brand}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 font-mono truncate">
                      Ubic: <strong className="text-gray-200">{prod.location || '—'}</strong> | Stock:{' '}
                      <strong className={(prod.availableStock ?? prod.currentStock) <= 0 && prod.isInventoryTracked !== false ? 'text-red-500' : 'text-brand-orange'}>
                        {prod.isInventoryTracked === false ? 'Venta Libre' : `${prod.availableStock ?? prod.currentStock} ${prod.unitOfMeasure}`}
                      </strong>
                      {prod.isInventoryTracked !== false && (prod.reservedStock ?? 0) > 0 && (
                        <span className="text-amber-400 font-bold ml-1.5">
                          (En cajas: {prod.reservedStock} {prod.unitOfMeasure})
                        </span>
                      )}
                      {!prod.brand && (
                        <>
                          {' '}| Marca: <strong className="text-gray-500">S/M</strong>
                        </>
                      )}
                    </p>
                  </div>

                  {/* DERECHA: Solo el precio limpio (si es 1 presentación) o Cantidad de Variantes + Botón Info */}
                  <div
                    className="flex items-center space-x-4 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasSinglePresentation && singlePresentation ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-2xl shadow-sm">
                        <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                          {formatCurrency(singlePresentation.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs bg-black px-3.5 py-2 rounded-xl text-gray-300 font-mono font-bold border border-gray-800">
                        {prod.presentations.length} vars.
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onShowInfo(prod);
                      }}
                      title="Ver ficha técnica del producto [Atajo: Alt+I]"
                      className="px-4 py-2 bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-black font-black text-sm rounded-2xl border-2 border-brand-orange/40 transition-all flex items-center space-x-2 shadow-sm group"
                    >
                      <span>ℹ️ Info</span>
                      <kbd className="bg-black/70 text-brand-orange group-hover:bg-black group-hover:text-brand-orange px-2 py-0.5 rounded-md text-xs font-mono font-black border border-brand-orange/40 shadow-inner">
                        Alt + I
                      </kbd>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

PosSearchBar.displayName = 'PosSearchBar';

export default PosSearchBar;