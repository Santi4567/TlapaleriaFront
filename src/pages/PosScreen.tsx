// src/pages/PosScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosTabs, MAX_TABS } from '../hooks/usePosTabs';
import { usePosSearch } from '../hooks/usePosSearch';
import { Product, ProductPresentation } from '../types/product';
import { PaymentMethod } from '../types/pos';
import { saleService } from '../services/saleService';

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
import PosProductInfoModal from '../components/pos/PosProductInfoModal';
import PosCloseAllConfirmModal from '../components/pos/PosCloseAllConfirmModal';
import PosTabLimitModal from '../components/pos/PosTabLimitModal';


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
    setPaymentMethod,
    closeAllTabs
  } = usePosTabs();

  // Referencias físicas (Para el atajo F3 y el escudo contra 100 pestañas)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastTabCreateTime = useRef(0);

  // Estados para modales de productos
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation | null>(null);
  const [infoProduct, setInfoProduct] = useState<Product | null>(null);

  // Estados de flujo de cobro, conversión y advertencias
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCloseAllModal, setShowCloseAllModal] = useState(false);
  const [showTabLimitModal, setShowTabLimitModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('NONE');
  
  // Estados para la API de Ventas
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  
  // Índice para navegar con flechas arriba/abajo en la lista de resultados
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  
  // Sistema de notificación flotante (Toasts)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // MAPA PARA TRADUCIR EL ENUM DEL FRONTEND AL STRING ESTRICTO DEL BACKEND DTO
  const API_PAYMENT_METHODS: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta'
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hook de búsqueda blindado contra rebotes
  const { searchTerm, setSearchTerm, results, isLoading, handleSelect } = usePosSearch((prod) => {
    if (!prod.presentations || prod.presentations.length === 0) {
      showNotification('❌ Este producto no tiene presentaciones activas.');
      return;
    }

    if (prod.presentations.length === 1) {
      // Si solo tiene 1, saltamos el modal de presentaciones para ser más rápidos
      setSelectedProduct(prod);
      setSelectedPresentation(prod.presentations[0]);
    } else {
      // Si tiene 2 o más, obligamos a que se muestre el menú de presentaciones
      setSelectedProduct(prod);
      setSelectedPresentation(null);
    }
  });

  // Cuando cambian los resultados, reseteamos el resaltado al primer elemento (0)
  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  // ============================================================================
  // ATAJOS DE TECLADO GLOBALES (F1, F2, F3, F4, F8/F12, F9)
  // ============================================================================
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. REGLA DE ORO ANTI-SPAM: Si la tecla se mantiene presionada, IGNORAR
      if (e.repeat) return;

      // ======================================================================
      // SALIDA DE EMERGENCIA: PONER EN ESPERA Y ATENDER SIGUIENTE [F9]
      // (SE EVALÚA PRIMERO para poder escapar de las pantallas de cobro)
      // ======================================================================
      if (e.key === 'F9') {
        e.preventDefault();
        // 1. Si hay algún modal de cobro abierto, lo cerramos instantáneamente
        if (checkoutStep !== 'NONE') {
          setCheckoutStep('NONE');
        }
        // 2. Si la pestaña actual tiene productos, creamos una nueva para no mezclar
        if (activeTab.items.length > 0) {
          if (Date.now() - lastTabCreateTime.current < 300) return;
          lastTabCreateTime.current = Date.now();
          createNewTab('SALE');
          showNotification(`⏳ "${activeTab.title}" en espera. Atendiendo nueva cuenta...`);
        }
        return; // Salimos para no evaluar el resto de teclas
      }

      // 2. MURO DE CONCRETO: Ignorar el resto de atajos si hay un modal crítico abierto
      if (checkoutStep !== 'NONE' || showSwitchModal || showClearModal || showCloseAllModal || showTabLimitModal || selectedProduct || infoProduct) return;

      if (e.key === 'F1') {
        e.preventDefault();
        if (Date.now() - lastTabCreateTime.current < 300) return;
        lastTabCreateTime.current = Date.now();
        handleCreateNewTab('SALE'); // <-- USAMOS LA ENVOLTURA
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (Date.now() - lastTabCreateTime.current < 300) return;
        lastTabCreateTime.current = Date.now();
        handleCreateNewTab('QUOTE'); // <-- USAMOS LA ENVOLTURA
      }else if (e.key === 'F3') {
        e.preventDefault();
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
      // ======================================================================
      // ATAJO: PARA COBRAR AHORA [F8 o F12]
      // ======================================================================
      else if (e.key === 'F8' || e.key === 'F12') {
        e.preventDefault();
        if (activeTab.type === 'SALE' && activeTab.items.length > 0) {
          setCheckoutStep('SELECT_METHOD');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [checkoutStep, showSwitchModal, showClearModal, showCloseAllModal, selectedProduct, infoProduct, activeTab.items.length, activeTab.type, createNewTab]);

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
      e.stopPropagation(); // CORTA EL BURBUJEO PARA QUE NO LE LLEGUE AL MODAL DE PRESENTACIÓN
      if (e.repeat) return;
      if (results[highlightedIndex]) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'i' && (e.altKey || e.ctrlKey)) {
      e.preventDefault();
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

  const handleFinishTransaction = async (referenceOrReceived: string | number) => {
    if (!user?.token) return;
    setIsProcessingSale(true);

    // 1. Armar el DTO exacto que pide tu backend
    const payload = {
      paymentMethod: API_PAYMENT_METHODS[activeTab.paymentMethod],
      paymentReference: referenceOrReceived.toString(),
      details: activeTab.items.map(item => ({
        presentationId: item.presentationId,
        quantity: item.quantity
      }))
    };

    // 2. Ejecutar Petición al Backend
    const response = await saleService.createSale(user.token, payload);
    setIsProcessingSale(false);

    if (response && response.success) {
      setLastSaleData(response.data);
      setCheckoutStep('SUCCESS');
    } else {
      showNotification(`❌ Error: ${response?.message || 'No se pudo registrar la venta.'}`);
    }
  };

  // REGLA: Al terminar venta exitosa, VACIAMOS TODO sin cerrar la pestaña
  const handleDismissSuccess = () => {
    setCheckoutStep('NONE');
    setLastSaleData(null);
    clearActiveTabItems();               // Vacia artículos
    setClientName('Público en General'); // Resetea cliente
    setPaymentMethod('CASH');            // Resetea método de pago
  };

  // NUEVO: Envoltura que intercepta cuando se intenta crear una pestaña y abre el modal si se llegó al límite
  const handleCreateNewTab = (type: 'SALE' | 'QUOTE'): boolean => {
    const success = createNewTab(type);
    if (!success) {
      setShowTabLimitModal(true);
    }
    return success;
  };

  return (
    // CONTENEDOR PRINCIPAL CON min-h-0 PARA SCROLL RESPONSIVO PERFECTO
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      
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
        onNewTab={handleCreateNewTab}
        onCloseTab={closeTab}
        onReorderTabs={reorderTabs}
        onClearTable={() => setShowClearModal(true)}
        onCloseAll={() => setShowCloseAllModal(true)}
        hasItems={activeTab.items.length > 0}
      />

      {/* 2. BUSCADOR CON REF F3 Y NAVEGACIÓN INTELIGENTE */}
      <div className="relative mb-6 flex-shrink-0">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="🔍 Escanea código de barras o busca por nombre (Ej. Cemento, THW, Valvula)..."
            className="w-full bg-[#121212] border-2 border-gray-800 text-white text-xl rounded-3xl pl-6 pr-32 py-4.5 font-bold focus:outline-none focus:border-brand-orange transition-all placeholder-gray-500 shadow-inner"
          />
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:inline">Atajo:</span>
            <kbd className="bg-gray-800 text-brand-orange px-3 py-1.5 rounded-xl text-sm font-mono font-black border-2 border-gray-700 shadow-md">
              F3
            </kbd>
          </div>

          {isLoading && <div className="absolute right-32 top-1/2 -translate-y-1/2 text-brand-orange animate-spin font-black text-2xl">↻</div>}
        </div>

        {/* LISTA DESPLEGABLE DE RESULTADOS */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-3 bg-[#121212] border-2 border-brand-orange/60 rounded-3xl shadow-2xl z-40 max-h-96 overflow-y-auto custom-scrollbar divide-y divide-gray-800/80">
            {results.map((prod, idx) => {
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={prod.id}
                  onClick={() => handleSelect(prod)}
                  className={`p-5 cursor-pointer flex justify-between items-center transition-all ${
                    isHighlighted ? 'bg-gray-800/90 border-l-8 border-brand-orange pl-4 shadow-md' : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex-1 pr-6 truncate">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-mono font-black text-brand-orange bg-black/60 px-2.5 py-1 rounded-lg text-sm border border-gray-800">
                        {prod.internalCode}
                      </span>
                      <h4 className="font-extrabold text-white text-lg truncate">{prod.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      Marca: <strong className="text-gray-200">{prod.brand || 'N/A'}</strong> | Ubic: <strong className="text-gray-200">{prod.location || '—'}</strong> | Stock: <strong className="text-brand-orange">{prod.currentStock} {prod.unitOfMeasure}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs bg-black px-3 py-1.5 rounded-xl text-gray-300 font-mono font-bold border border-gray-800">
                      {prod.presentations.length} {prod.presentations.length === 1 ? 'pres.' : 'vars.'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setInfoProduct(prod)}
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

      {/* 3. TABLA Y CHECKOUT (RESPONSIVO CON SCROLL) */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-y-auto xl:overflow-hidden custom-scrollbar pr-2 xl:pr-0 pb-4 xl:pb-0 min-h-0">
        
        <div className="flex-1 flex flex-col min-h-[400px] xl:min-h-0">
          <PosCartTable items={activeTab.items} onUpdateQty={updateItemQuantity} onRemove={removeItem} />
        </div>
        
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

      {/* 5. MODAL DE FICHA TÉCNICA DEL PRODUCTO */}
      {infoProduct && (
        <PosProductInfoModal
          product={infoProduct}
          onClose={() => setInfoProduct(null)}
          onAddProduct={(prod) => {
            setInfoProduct(null);
            handleSelect(prod);
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
          isProcessing={isProcessingSale}
          onClose={() => setCheckoutStep('SELECT_METHOD')}
          onConfirm={(received) => handleFinishTransaction(received)}
        />
      )}

      {checkoutStep === 'TRANSFER_CARD_INPUT' && (
        <PosPaymentModal
          method={activeTab.paymentMethod}
          totalAmount={totalAmount}
          clientName={activeTab.clientName}
          isProcessing={isProcessingSale}
          onClose={() => setCheckoutStep('SELECT_METHOD')}
          onConfirmPayment={(ref) => handleFinishTransaction(ref)}
        />
      )}

      {checkoutStep === 'SUCCESS' && lastSaleData && (
        <PosSuccessModal
          saleData={lastSaleData}
          onFinish={handleDismissSuccess}
        />
      )}

      {showCloseAllModal && (
        <PosCloseAllConfirmModal
          tabsCount={tabs.length}
          onClose={() => setShowCloseAllModal(false)}
          onConfirm={() => {
            closeAllTabs();
            setShowCloseAllModal(false);
            showNotification('🧹 Todas las pestañas han sido cerradas.');
          }}
        />
      )}
      
      {/* MODAL DE ADVERTENCIA DE LÍMITE DE PESTAÑAS */}
      {showTabLimitModal && (
        <PosTabLimitModal
          maxTabs={MAX_TABS}
          onClose={() => setShowTabLimitModal(false)}
        />
      )}
      

    </div>
  );
};

export default PosScreen;