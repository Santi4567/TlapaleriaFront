// src/pages/ProductHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import SearchBarHistory from '../components/ProductHistory/SearchBarHistory';
import ProductGraphHome from '../components/ProductHistory/ProductGraphHome';

const ProductHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Variable para controlar la animación en el eje Y
  const isSearching = searchTerm.trim() !== '';

  useEffect(() => {
    if (!user?.token) return;
    if (!isSearching) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setIsLoading(true);
      const response = await productService.searchProducts(user.token, searchTerm, true);
      if (response && response.success) {
        setSearchResults(response.data);
      }
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, user?.token, isSearching]);

  const handleCloseGraphView = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setSearchResults([]);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#111111] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden">
      
      {/* VISTA 1: BUSCADOR CENTRADO (ANIMACIÓN EJE Y) */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out z-10 
        ${selectedProduct ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
        ${isSearching ? '-translate-y-32' : 'translate-y-0'}`}
      >
        <div className="text-center mb-8 w-full max-w-4xl flex flex-col items-center">
          {/* Icono decorativo */}
          <div className="w-20 h-20 bg-[#1a1a1a] border-2 border-brand-orange/50 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,107,0,0.15)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ff6b00" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <h2 className="text-5xl font-extrabold text-white tracking-tight mb-3 drop-shadow-md">Historial de Precios</h2>
          <p className="text-gray-400 text-xl font-medium">Escanea o busca un producto para analizar su evolución en el tiempo.</p>
        </div>

        <div className="w-full max-w-4xl relative">
          <SearchBarHistory 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            results={searchResults}
            isLoading={isLoading}
            onSelect={setSelectedProduct}
          />
        </div>
      </div>

      {/* VISTA 2: GRÁFICAS E INFORMACIÓN */}
      {selectedProduct && (
        <div 
          style={{ animation: 'slideInFromBottom 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          className="absolute inset-0 w-full h-full flex flex-col z-30 bg-[#111111] p-8"
        >
          <div className="mb-6 flex-shrink-0 flex items-center justify-between">
            <button 
              onClick={handleCloseGraphView}
              className="bg-[#1a1a1a] border border-gray-700 hover:border-brand-orange text-white hover:text-brand-orange px-5 py-2.5 rounded-xl font-bold text-lg flex items-center transition-all shadow-lg"
            >
              <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded mr-3 font-mono">Esc</span>
              Volver al buscador
            </button>
            <div className="text-brand-orange font-bold text-xl drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]">
              Análisis Histórico
            </div>
          </div>

          <ProductGraphHome product={selectedProduct} />
        </div>
      )}

      <style>{`
        @keyframes slideInFromBottom {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ProductHistoryScreen;