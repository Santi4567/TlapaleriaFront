// src/pages/PosScreen.tsx
import React, { useState } from 'react';
import { usePosTabs } from '../hooks/usePosTabs';
import { usePosSearch } from '../hooks/usePosSearch';
import { Product, ProductPresentation } from '../types/product';

import PosTabBar from '../components/pos/PosTabBar';
import PosCartTable from '../components/pos/PosCartTable';
import PosCheckoutPanel from '../components/pos/PosCheckoutPanel';
import PosPresentationModal from '../components/pos/PosPresentationModal';
import PosQuantityModal from '../components/pos/PosQuantityModal';

const PosScreen: React.FC = () => {
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    closeTab,
    reorderTabs,
    addItemToCart,
    updateItemQuantity,
    removeItem,
    setClientName
  } = usePosTabs();

  // Estados temporales para los modales de captura
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation | null>(null);

  // Hook aislado de peticiones API
  const {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    handleSelect
  } = usePosSearch((prod) => {
    // REGLA DE NEGOCIO: Si solo tiene 1 presentación, pasamos directo a capturar cantidad
    if (prod.presentations.length === 1) {
      setSelectedProduct(prod);
      setSelectedPresentation(prod.presentations[0]);
    } else if (prod.presentations.length > 1) {
      // Si tiene varias (ej. Kilo Suelto y Bulto), abrimos menú de selección
      setSelectedProduct(prod);
    }
  });

  // Confirmación final para inyectar al Carrito de localStorage
  const handleConfirmAdd = (qty: number) => {
    if (!selectedProduct || !selectedPresentation) return;

    addItemToCart({
      productId: selectedProduct.id,
      presentationId: selectedPresentation.id,
      internalCode: selectedPresentation.code || selectedProduct.internalCode,
      barcode: selectedPresentation.barcode || selectedProduct.barcode,
      name: selectedProduct.name,
      presentationName: selectedPresentation.name,
      unitPrice: selectedPresentation.price,
      stockFactor: selectedPresentation.stockFactor,
      maxStock: selectedProduct.currentStock,
      // Propiedades de visualización extra para la nueva tabla
      brand: selectedProduct.brand,
      location: selectedProduct.location,
      unitOfMeasure: selectedProduct.unitOfMeasure
    } as any, qty);

    // Limpiamos los modales
    setSelectedProduct(null);
    setSelectedPresentation(null);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden">
      
      {/* 1. BARRA DE PESTAÑAS (DRAG & DROP + LOCALSTORAGE) */}
      <PosTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onNewTab={createNewTab}
        onCloseTab={closeTab}
        onReorderTabs={reorderTabs}
      />

      {/* 2. BUSCADOR INTEGRADO */}
      <div className="relative mb-6 flex-shrink-0">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Escanea código de barras o busca por nombre (Ej. Cemento, THW, Valvula)..."
          className="w-full bg-[#121212] border-2 border-gray-800 text-white text-lg rounded-2xl pl-5 pr-12 py-4 font-bold focus:outline-none focus:border-brand-orange transition-all placeholder-gray-500 shadow-inner"
        />
        {isLoading && (
          <div className="absolute right-4 top-4 text-brand-orange animate-spin font-black text-xl">↻</div>
        )}

        {/* Lista Flotante de Resultados */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-brand-orange/50 rounded-2xl shadow-2xl z-40 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-800">
            {results.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleSelect(prod)}
                className="p-4 hover:bg-gray-800/80 cursor-pointer flex justify-between items-center transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-brand-orange text-sm">{prod.internalCode}</span>
                    <h4 className="font-extrabold text-white text-base">{prod.name}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    Marca: {prod.brand || 'N/A'} | Ubicación: {prod.location || '—'} | Stock: {prod.currentStock} {prod.unitOfMeasure}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-black px-2 py-1 rounded text-gray-300 font-mono border border-gray-800">
                    {prod.presentations.length} {prod.presentations.length === 1 ? 'presentación' : 'variantes'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. TABLA Y CHECKOUT */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
        <PosCartTable
          items={activeTab.items}
          onUpdateQty={updateItemQuantity}
          onRemove={removeItem}
        />
        <PosCheckoutPanel
          activeTab={activeTab}
          onClientChange={setClientName}
          onProcessSale={() => {
            alert(`Cobro procesado para "${activeTab.title}"`);
            closeTab(activeTabId);
          }}
          onPrintQuote={() => alert('Imprimiendo Cotización...')}
        />
      </div>

      {/* 4. MODALES DE FLUJO ATÓMICO */}
      {selectedProduct && !selectedPresentation && (
        <PosPresentationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelect={(pres) => setSelectedPresentation(pres)}
        />
      )}

      {selectedProduct && selectedPresentation && (
        <PosQuantityModal
          product={selectedProduct}
          presentation={selectedPresentation}
          onClose={() => { setSelectedProduct(null); setSelectedPresentation(null); }}
          onConfirm={handleConfirmAdd}
        />
      )}

    </div>
  );
};

export default PosScreen;