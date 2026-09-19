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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIndex(-1);
    if (!searchTerm) inputRef.current?.focus();
  }, [results, searchTerm]);

  useEffect(() => {
    const handleF3 = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault(); // Evita que se abra el buscador de Windows/Linux
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleF3);
    return () => window.removeEventListener('keydown', handleF3);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
    }
  };

  return (
    <div className="w-full flex flex-col relative z-50">
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
          onChange={(e) => onSearchChange(e.target.value)}
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
      {results.length > 0 && (
        <div className="absolute top-[110%] left-0 w-full bg-[#161616] border border-brand-orange rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50">
          <div className="max-h-[45vh] overflow-y-auto custom-scrollbar">
            {results.map((product, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div 
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className={`p-4 cursor-pointer transition-all border-b border-gray-800 flex flex-col justify-center ${
                    isSelected ? 'bg-[#1e2329] border-l-4 border-l-brand-orange' : 'hover:bg-[#1a1a1a] border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#1a1a1a] text-brand-orange font-bold px-3 py-1 rounded text-sm border border-brand-orange/30">
                        {product.internalCode}
                      </span>
                      <p className="text-white font-bold text-xl">{product.name}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-bold bg-[#1a1a1a] px-3 py-1 rounded-lg text-sm border border-gray-800">
                        {product.presentations.length} pres.
                      </span>
                      {isSelected && (
                        <span className="bg-brand-orange text-black font-extrabold px-3 py-1 rounded-lg text-sm flex items-center shadow-[0_0_10px_rgba(255,107,0,0.4)]">
                          Enter ↵
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm mt-1 ml-[4.5rem]">
                    <span className="text-gray-500">Marca: <span className="text-gray-300 font-semibold">{product.brand || 'N/A'}</span></span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-500">Ubic: <span className="text-gray-300 font-semibold">{product.location || 'N/A'}</span></span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-500">Stock: <span className="text-brand-orange font-bold">{product.currentStock}</span> PZA</span>
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