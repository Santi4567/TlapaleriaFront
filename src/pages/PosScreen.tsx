// src/pages/PosScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosTabs } from '../hooks/usePosTabs';
import { usePosSearch } from '../hooks/usePosSearch';
import { Product, ProductPresentation } from '../types/product';
import { PaymentMethod } from '../types/pos';

import PosTabBar from '../components/pos/PosTabBar';
import PosCartTable from '../components/pos/PosCartTable';
import PosCheckoutPanel from '../components/pos/PosCheckoutPanel';
import PosPresentationModal from '../components/pos/PosPresentationModal';
import PosQuantityModal from '../components/pos/PosQuantityModal';

// MODALES GLOBALES
import PosSwitchConfirmModal from '../components/pos/PosSwitchConfirmModal';
import PosPaymentMethodModal from '../components/pos/PosPaymentMethodModal';
import PosCashModal from '../components/pos/PosCashModal';
import PosPaymentModal from '../components/pos/PosPaymentModal';
import PosSuccessModal from '../components/pos/PosSuccessModal';
import PosClearConfirmModal from '../components/pos/PosClearConfirmModal';
import PosProductInfoModal from '../components/pos/PosProductInfoModal'; // <-- NUEVO MODAL

type CheckoutStep = 'NONE' | 'SELECT_METHOD' | 'CASH_HELPER' | 'TRANSFER_CARD_INPUT' | 'SUCCESS';

const PosScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    closeTab,
    reorderTabs,
    switchTabType,
    addItemToCart,
    updateItemQuantity,
    removeItem,
    clearActiveTabItems,
    setClientName,
    setPaymentMethod
  } = usePosTabs();

  // Referencia física para el buscador (Para el atajo F3)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados para modales de productos
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation | null>(null);
  
  // NUEVO: Estado para abrir la ficha técnica del producto
  const [infoProduct, setInfoProduct] = useState<Product | null>(null);

  // Estados de flujo de cobro, conversión y advertencias
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('NONE');
  const [lastSaleId, setLastSaleId] = useState<string>('');
  
  // Índice para navegar con flechas arriba/abajo en la lista de resultados
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  
  // Sistema de notificación flotante (Toasts)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hook de búsqueda
  const { searchTerm, setSearchTerm, results, isLoading, handleSelect } = usePosSearch((prod) => {
    if (prod.presentations.length === 1) {
      setSelectedProduct(prod);
      setSelectedPresentation(prod.presentations[0]);
    } else if (prod.presentations.length > 1) {
      setSelectedProduct(prod);
    }
  });

  // Cuando cambian los resultados, reseteamos el resaltado al primer elemento (0)
  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  // ============================================================================
  // ATAJOS DE TECLADO GLOBALES (F1, F2, F3, F4)
  // ============================================================================
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar si hay un modal crítico abierto
      if (checkoutStep !== 'NONE' || showSwitchModal || showClearModal || selectedProduct || infoProduct) return;

      if (e.key === 'F1') {
        e.preventDefault();
        createNewTab('SALE');
      } else if (e.key === 'F2') {
        e.preventDefault();
        createNewTab('QUOTE');
      } else if (e.key === 'F3') {
        e.preventDefault();
        // ATAJO F3: Saltar al buscador y seleccionar todo el texto para escribir rápido
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (activeTab.items.length > 0) {
          setShowClearModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [checkoutStep, showSwitchModal, showClearModal, selectedProduct, infoProduct, activeTab.items.length, createNewTab]);

  // ============================================================================
  // NAVEGACIÓN POR TECLADO EN LA LISTA DESPLEGABLE DE RESULTADOS
  // ============================================================================
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Enter selecciona normalmente para vender
      if (results[highlightedIndex]) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'i' && (e.altKey || e.ctrlKey)) {
      e.preventDefault();
      // Atajo Alt+I o Ctrl+I: Abre la ficha informativa del producto resaltado
      if (results[highlightedIndex]) {
        setInfoProduct(results[highlightedIndex]);
      }
    }
  };

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
      brand: selectedProduct.brand,
      location: selectedProduct.location,
      unitOfMeasure: selectedProduct.unitOfMeasure
    } as any, qty);
    setSelectedProduct(null);
    setSelectedPresentation(null);
  };

  // CÁLCULO DE TOTAL
  const totalAmount = activeTab.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0) * 1.16 - (activeTab.discount || 0);

  // MANEJADORES DEL FLUJO DE COBRO
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'CASH') {
      setCheckoutStep('CASH_HELPER');
    } else {
      setCheckoutStep('TRANSFER_CARD_INPUT');
    }
  };

  const handleFinishTransaction = (referenceOrReceived: string | number) => {
    const generatedId = `V-20260717-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastSaleId(generatedId);
    setCheckoutStep('SUCCESS');
  };

  const handleDismissSuccess = () => {
    setCheckoutStep('NONE');
    closeTab(activeTabId);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden">
      
      {/* NOTIFICACIÓN FLOTANTE ESTILO TOAST */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-brand-orange/50 px-6 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center space-x-3 text-white font-bold text-sm">
            <span className="text-brand-orange text-lg">ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. BARRA DE PESTAÑAS */}
      <PosTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onNewTab={createNewTab}
        onCloseTab={closeTab}
        onReorderTabs={reorderTabs}
        onClearTable={() => setShowClearModal(true)}
        hasItems={activeTab.items.length > 0}
      />

      {/* 2. BUSCADOR CON REF F3 Y NAVEGACIÓN INTELIGENTE */}
      <div className="relative mb-6 flex-shrink-0">
        <div className="relative">
          <input
            ref={searchInputRef} // <-- REF PARA ATAJO F3
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown} // <-- NAVEGACIÓN POR FLECHAS Y ATAJO ALT+I
            placeholder="🔍 Escanea código de barras o busca por nombre (Ej. Cemento, THW, Valvula) [Atajo: F3]..."
            className="w-full bg-[#121212] border-2 border-gray-800 text-white text-lg rounded-2xl pl-5 pr-28 py-4 font-bold focus:outline-none focus:border-brand-orange transition-all placeholder-gray-500 shadow-inner"
          />
          <span className="absolute right-4 top-4 bg-gray-800 text-gray-400 px-2 py-1 rounded-lg text-xs font-mono pointer-events-none border border-gray-700">
            F3
          </span>
          {isLoading && <div className="absolute right-14 top-4 text-brand-orange animate-spin font-black text-xl">↻</div>}
        </div>

        {/* LISTA DESPLEGABLE CON BOTÓN DE INFO INTEGRADO */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-brand-orange/50 rounded-2xl shadow-2xl z-40 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-800">
            {results.map((prod, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={prod.id}
                  onClick={() => handleSelect(prod)}
                  className={`p-4 cursor-pointer flex justify-between items-center transition-all ${
                    isHighlighted ? 'bg-gray-800/90 border-l-4 border-brand-orange pl-3' : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex-1 pr-4 truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-brand-orange text-sm">{prod.internalCode}</span>
                      <h4 className="font-extrabold text-white text-base truncate">{prod.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                      Marca: {prod.brand || 'N/A'} | Ubic: {prod.location || '—'} | Stock: {prod.currentStock} {prod.unitOfMeasure}
                    </p>
                  </div>

                  {/* ACCIONES DE LA FILA: PRESENTACIONES Y BOTÓN INFO */}
                  <div className="flex items-center space-x-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs bg-black px-2 py-1 rounded text-gray-300 font-mono border border-gray-800">
                      {prod.presentations.length} {prod.presentations.length === 1 ? 'pres.' : 'vars.'}
                    </span>

                    {/* BOTÓN DE INFO INDEPENDIENTE */}
                    <button
                      type="button"
                      onClick={() => setInfoProduct(prod)}
                      title="Ver ficha técnica del producto [Atajo: Alt+I]"
                      className="px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-black font-extrabold text-xs rounded-xl border border-brand-orange/30 transition-all flex items-center space-x-1 shadow-sm"
                    >
                      <span>ℹ️ Info</span>
                      <span className="bg-brand-orange/20 text-current px-1 py-0.2 rounded text-[9px] font-mono border border-current">Alt+I</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. TABLA Y CHECKOUT */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
        <PosCartTable items={activeTab.items} onUpdateQty={updateItemQuantity} onRemove={removeItem} />
        <PosCheckoutPanel
          activeTab={activeTab}
          onClientChange={setClientName}
          onProcessSale={() => setCheckoutStep('SELECT_METHOD')}
          onPrintQuote={() => showNotification(`🖨️ Imprimiendo cotización de "${activeTab.title}"...`)}
          onRequestSwitch={() => setShowSwitchModal(true)}
        />
      </div>

      {/* 4. MODALES DE SELECCIÓN DE PRODUCTO Y CANTIDAD */}
      {selectedProduct && !selectedPresentation && (
        <PosPresentationModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelect={(pres) => setSelectedPresentation(pres)} />
      )}
      {selectedProduct && selectedPresentation && (
        <PosQuantityModal product={selectedProduct} presentation={selectedPresentation} onClose={() => { setSelectedProduct(null); setSelectedPresentation(null); }} onConfirm={handleConfirmAdd} />
      )}

      {/* 5. NUEVO: MODAL DE INFORMACIÓN Y FICHA TÉCNICA DEL PRODUCTO */}
      {infoProduct && (
        <PosProductInfoModal
          product={infoProduct}
          onClose={() => setInfoProduct(null)}
          onAddProduct={(prod) => {
            setInfoProduct(null); // Cerramos la ficha info
            handleSelect(prod);   // Disparamos el flujo normal de venta (pres/cantidad)
          }}
        />
      )}

      {/* 6. MODAL GLOBAL DE ADVERTENCIA PARA VACIAR TABLA */}
      {showClearModal && (
        <PosClearConfirmModal
          tabTitle={activeTab.title}
          itemsCount={activeTab.items.reduce((acc, i) => acc + i.quantity, 0)}
          onClose={() => setShowClearModal(false)}
          onConfirm={() => {
            clearActiveTabItems();
            setShowClearModal(false);
            showNotification(`🗑️ Tabla de "${activeTab.title}" vaciada.`);
          }}
        />
      )}

      {/* 7. MODAL GLOBAL DE CAMBIO DE TIPO DE CUENTA */}
      {showSwitchModal && (
        <PosSwitchConfirmModal
          currentType={activeTab.type}
          onClose={() => setShowSwitchModal(false)}
          onConfirm={() => { switchTabType(activeTab.type === 'QUOTE' ? 'SALE' : 'QUOTE'); setShowSwitchModal(false); }}
        />
      )}

      {/* 8. MÁQUINA DE ESTADOS DEL COBRO EN CASCADA */}
      {checkoutStep === 'SELECT_METHOD' && (
        <PosPaymentMethodModal
          totalAmount={totalAmount}
          onClose={() => setCheckoutStep('NONE')}
          onSelectMethod={handleSelectPaymentMethod}
        />
      )}

      {checkoutStep === 'CASH_HELPER' && (
        <PosCashModal
          totalAmount={totalAmount}
          onClose={() => setCheckoutStep('SELECT_METHOD')}
          onConfirm={(received, change) => handleFinishTransaction(received)}
        />
      )}

      {checkoutStep === 'TRANSFER_CARD_INPUT' && (
        <PosPaymentModal
          method={activeTab.paymentMethod}
          totalAmount={totalAmount}
          clientName={activeTab.clientName}
          onClose={() => setCheckoutStep('SELECT_METHOD')}
          onConfirmPayment={(ref) => handleFinishTransaction(ref)}
        />
      )}

      {checkoutStep === 'SUCCESS' && (
        <PosSuccessModal
          saleId={lastSaleId}
          totalAmount={totalAmount}
          paymentMethod={activeTab.paymentMethod}
          cashierName={user?.name || 'Cajero Principal'}
          onFinish={handleDismissSuccess}
        />
      )}

    </div>
  );
};

export default PosScreen;