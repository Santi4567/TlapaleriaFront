// src/pages/InventoryScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import { Product } from '../types/product';
import { useAuth } from '../context/AuthContext';

import InventorySlidingPanel from '../components/Inventario/InventorySlidingPanel';
import InventoryTable from '../components/Inventario/InventoryTable';
import InventoryMessageModal from '../components/Inventario/InventoryMessageModal';

const InventoryScreen: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token || ''; 

  // Estados del Buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownResults, setDropdownResults] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Estados del Sliding Panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de Modales
  const [untrackedProduct, setUntrackedProduct] = useState<Product | null>(null);
  const [msgModal, setMsgModal] = useState<{isOpen: boolean, type: 'success' | 'error' | 'warning', text: string}>({
    isOpen: false, type: 'success', text: ''
  });

  //Estados 
  const [refreshCounter, setRefreshCounter] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Atajo F3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Buscador en tiempo real
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        setIsLoadingSearch(true);
        const response = await productService.searchProducts(token, searchTerm);
        if (response?.success) {
          setDropdownResults(response.data.slice(0, 6)); 
        }
        setIsLoadingSearch(false);
      } else {
        setDropdownResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, token]);

  // Resetear el índice resaltado cuando cambian los resultados
  useEffect(() => {
    setHighlightedIndex(0);
  }, [dropdownResults]);

  const handleSelectFromDropdown = (product: Product) => {
    setSearchTerm('');
    setDropdownResults([]);
    searchInputRef.current?.blur();

    if (!product.isInventoryTracked) {
      setUntrackedProduct(product);
    } else {
      setSelectedProduct(product);
      setIsPanelOpen(true);
    }
  };

  // Manejo de teclas direccionales y Enter en el buscador
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (dropdownResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % dropdownResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + dropdownResults.length) % dropdownResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownResults[highlightedIndex]) {
        handleSelectFromDropdown(dropdownResults[highlightedIndex]);
      }
    }
  };

  // Cambiamos de 1 | 2 a 1 | 2 | 3 | 4
  const handleMovementSubmit = async (movementType: 1 | 2 | 3 | 4, quantity: number, notes: string) => {
    if (!selectedProduct) return;
    setIsProcessing(true);

    const response = await inventoryService.registerMovement(token, {
      productId: selectedProduct.id,
      movementType, // Aquí se manda el 1, 2, 3 o 4 al backend
      quantity,
      notes
    });

    setIsProcessing(false);

    if (response?.success) {
      setSelectedProduct(prev => prev ? { ...prev, currentStock: response.data.newStock } : null);
      
      setMsgModal({ 
        isOpen: true, 
        type: 'success', 
        text: `Movimiento registrado. Nuevo stock: ${response.data.newStock}` 
      });

      setRefreshCounter(prev => prev + 1); 

    } else {
      setMsgModal({ 
        isOpen: true, 
        type: 'error', 
        text: response?.message || "No se pudo guardar el movimiento." 
      });
    }
  };

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden">
      
      {/* =========================================================
          PANTALLA BASE (Animación optimizada)
          ========================================================= */}
      <div 
        className={`absolute inset-0 bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col origin-center transform-gpu transition-[transform,opacity] duration-300 ease-out will-change-transform
          ${isPanelOpen ? 'scale-[0.97] opacity-40 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Gestión de Inventario</h2>
        
        {/* BUSCADOR */}
        <div className="relative mb-6 flex-shrink-0 z-30">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="🔍 Busca un producto para ajustar (Ej. Cemento, THW)..."
              className="w-full bg-[#121212] border-2 border-gray-800 text-white text-lg rounded-2xl pl-6 pr-32 py-4 font-bold focus:outline-none focus:border-brand-orange transition-all placeholder-gray-500 shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
              <span className="text-xs font-bold text-gray-500 uppercase">Atajo:</span>
              <kbd className="bg-gray-800 text-brand-orange px-3 py-1.5 rounded-xl text-sm font-mono font-black border-2 border-gray-700 shadow-md">
                F3
              </kbd>
            </div>
            {isLoadingSearch && <div className="absolute right-28 top-1/2 -translate-y-1/2 text-brand-orange animate-spin text-xl font-black">↻</div>}
          </div>

          {/* RESULTADOS CON DISEÑO MEJORADO */}
          {dropdownResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-brand-orange/60 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-800/80">
              {dropdownResults.map((prod, index) => {
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectFromDropdown(prod)}
                    className={`p-4 cursor-pointer flex justify-between items-center transition-all border-l-4 group
                      ${isHighlighted ? 'bg-gray-800/90 border-brand-orange pl-6 shadow-md' : 'border-transparent hover:bg-gray-800/80 hover:border-brand-orange hover:pl-5'}
                    `}
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="font-mono text-brand-orange bg-black px-2 py-1 rounded text-xs border border-gray-800 font-bold">
                          {prod.internalCode}
                        </span>
                        <h4 className="font-bold text-white text-base truncate max-w-sm">{prod.name}</h4>
                        
                        {/* ETIQUETAS DE INFORMACIÓN (BADGES) */}
                        {!prod.isInventoryTracked && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-black uppercase tracking-wider">
                            Venta Libre
                          </span>
                        )}
                        {prod.isInventoryTracked && prod.allowFractions && (
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-blue-500/30 font-black uppercase tracking-wider">
                            Fraccionable
                          </span>
                        )}
                        {prod.isInventoryTracked && !prod.allowFractions && (
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-black uppercase tracking-wider">
                            Enteros
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        Stock actual: <strong className={`text-lg ml-1 ${prod.currentStock > 0 ? 'text-white' : 'text-red-400'}`}>{prod.currentStock}</strong> <span className="text-xs text-gray-500">{prod.unitOfMeasure}</span>
                      </p>
                    </div>
                    <div className={`text-sm px-3 py-1 rounded-lg transition-colors ${isHighlighted ? 'bg-brand-orange text-white font-bold' : 'text-gray-500 bg-black/40'}`}>
                      {isHighlighted ? 'Presiona Enter ↵' : 'Seleccionar ↵'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TABLA DE ÚLTIMOS MOVIMIENTOS */}
        <div className="flex-1 bg-[#1c1c1c] border border-gray-800 rounded-2xl overflow-hidden z-10 flex flex-col">
          <InventoryTable refreshTrigger={refreshCounter} />
        </div>
      </div>

      

      {/* =========================================================
          PANEL DE AJUSTE LATERAL
          ========================================================= */}
      <InventorySlidingPanel 
        isOpen={isPanelOpen}
        product={selectedProduct}
        onClose={() => setIsPanelOpen(false)}
        onSubmit={handleMovementSubmit}
        onError={(msg) => setMsgModal({ isOpen: true, type: 'warning', text: msg })}
        isProcessing={isProcessing}
        refreshTrigger={refreshCounter}
      />

      {/* =========================================================
          MODAL DE MENSAJES GLOBAL
          ========================================================= */}
      <InventoryMessageModal 
        isOpen={msgModal.isOpen}
        type={msgModal.type}
        message={msgModal.text}
        onClose={() => setMsgModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* =========================================================
          MODAL: PRODUCTO DE VENTA LIBRE
          ========================================================= */}
      {untrackedProduct && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1c1c1c] border-2 border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/50 rounded-full mb-6 mx-auto text-3xl">
              🚫
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Producto con venta libre</h3>
            <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
              El producto <strong className="text-white">{untrackedProduct.name}</strong> tiene el control de inventario desactivado. <br/><br/>
              Si quiere cambiar esta propiedad, actualice el producto en la sección de: <br/>
              <span className="text-brand-orange font-mono">Productos {">"} Editar {">"} Configuraciones</span>.
            </p>
            <button 
              onClick={() => setUntrackedProduct(null)}
              className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryScreen;