// src/components/ProductHistory/SearchBarHistory.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types/product';

interface Props {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  results: Product[];
  isLoading: boolean;
  onSelect: (product: Product) => void;
}

const SearchBarHistory: React.FC<Props> = ({ searchTerm, onSearchChange, results, isLoading, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Formateador de moneda para mostrar el precio cuando tiene 1 sola presentación
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  // 1. Cerrar la lista desplegable al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Cuando cambian los resultados, seleccionamos el primero (0) y abrimos la lista
  useEffect(() => {
    setSelectedIndex(0);
    resultsItemRefs.current = [];
    if (results.length > 0) {
      setIsDropdownOpen(true);
    }
    if (!searchTerm) inputRef.current?.focus();
  }, [results, searchTerm]);

  // 3. Auto-scroll automático cuando cambia selectedIndex con las flechas
  useEffect(() => {
    if (!isDropdownOpen || selectedIndex < 0) return;
    const activeElement = resultsItemRefs.current[selectedIndex];
    if (activeElement) {
      activeElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isDropdownOpen]);

  // 4. Atajo F3 para enfocar, seleccionar texto y reabrir la lista
  useEffect(() => {
    const handleF3 = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault(); // Evita que se abra el buscador de Windows/Linux
        inputRef.current?.focus();
        inputRef.current?.select();
        if (results.length > 0) setIsDropdownOpen(true);
      }
    };

    window.addEventListener('keydown', handleF3);
    return () => window.removeEventListener('keydown', handleF3);
  }, [results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      return;
    }

    if (results.length === 0) return;

    // Si la lista estaba oculta y presionan flecha arriba/abajo, la reabrimos
    if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      setIsDropdownOpen(false);
      onSelect(results[selectedIndex]);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col relative z-50">
      {/* Contenedor del Input con el estilo "Glow" naranja */}
      <div className={`relative transition-all duration-300 rounded-2xl ${
        searchTerm.length > 0 ? 'border border-brand-orange shadow-[0_0_20px_rgba(255,107,0,0.15)]' : 'border border-gray-700'
      }`}>
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Escanea el código de barras o busca por nombre..." 
          value={searchTerm}
          onFocus={() => {
            if (results.length > 0) setIsDropdownOpen(true);
          }}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full bg-[#161616] text-white text-2xl font-semibold rounded-2xl pl-16 pr-24 py-5 focus:outline-none placeholder-gray-600"
        />

        <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-gray-600 font-mono text-sm bg-[#1a1a1a] px-3 py-1 rounded-lg border border-gray-800">F3</span>
          )}
        </div>
      </div>

      {/* Lista flotante con bordes naranjas y divisores oscuros */}
      {isDropdownOpen && results.length > 0 && (
        <div className="absolute top-[110%] left-0 w-full bg-[#161616] border border-brand-orange rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50">
          <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
            {results.map((product, index) => {
              const isSelected = selectedIndex === index;
              const hasSinglePresentation = product.presentations && product.presentations.length === 1;
              const singlePresentation = hasSinglePresentation ? product.presentations[0] : null;

              return (
                <div 
                  key={product.id}
                  ref={(el) => {
                    resultsItemRefs.current[index] = el;
                  }}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onSelect(product);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-4 cursor-pointer transition-all border-b border-gray-800 flex flex-col justify-center ${
                    isSelected ? 'bg-[#1e2329] border-l-4 border-l-brand-orange' : 'hover:bg-[#1a1a1a] border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5 gap-4">
                    {/* IZQUIERDA: Código + Nombre + Badge de Marca */}
                    <div className="flex items-center flex-wrap gap-2.5 min-w-0">
                      <span className="bg-[#1a1a1a] text-brand-orange font-bold px-3 py-1 rounded text-sm border border-brand-orange/30 font-mono flex-shrink-0">
                        {product.internalCode}
                      </span>
                      <p className="text-white font-bold text-xl truncate">{product.name}</p>
                      {product.brand && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm flex-shrink-0">
                          🏷️ {product.brand}
                        </span>
                      )}
                    </div>
                    
                    {/* DERECHA: Precio limpio (si es 1 pres.) o cantidad de variantes + Enter */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {hasSinglePresentation && singlePresentation ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-xl shadow-sm">
                          <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">
                            {formatCurrency(singlePresentation.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-bold bg-[#1a1a1a] px-3 py-1 rounded-lg text-sm border border-gray-800 font-mono">
                          {product.presentations.length} vars.
                        </span>
                      )}

                      {isSelected && (
                        <span className="bg-brand-orange text-black font-extrabold px-3 py-1 rounded-lg text-sm flex items-center shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                          Enter ↵
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Segunda línea: Ubicación y Stock */}
                  <div className="flex gap-4 text-xs font-mono mt-0.5 ml-1">
                    <span className="text-gray-500">
                      Ubic: <span className="text-gray-300 font-semibold">{product.location || 'N/A'}</span>
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-500">
                      Stock: <span className="text-brand-orange font-bold">{product.currentStock}</span> {product.unitOfMeasure || 'PZA'}
                    </span>
                    {!product.brand && (
                      <>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-500">
                          Marca: <span className="text-gray-400 font-semibold">S/M</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBarHistory;