// src/pages/PosScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosTabs, MAX_TABS } from '../hooks/usePosTabs';
import { Product, ProductPresentation } from '../types/product';
import { PaymentMethod } from '../types/pos';
import { saleService } from '../services/saleService';
import { inventoryHubService } from '../services/inventoryHubService';

import PosTabBar from '../components/pos/PosTabBar';
import PosSearchBar from '../components/pos/PosSearchBar';
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
  } = usePosTabs((msg) => showNotification(msg));

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

  useEffect(() => {
    const unsubscribe = inventoryHubService.onStockUpdated((update) => {
      setSelectedProduct((prev) =>
        prev && prev.id === update.productId
          ? {
              ...prev,
              currentStock: update.currentStock,
              reservedStock: update.reservedStock,
              availableStock: update.availableStock
            }
          : prev
      );

      setInfoProduct((prev) =>
        prev && prev.id === update.productId
          ? {
              ...prev,
              currentStock: update.currentStock,
              reservedStock: update.reservedStock,
              availableStock: update.availableStock
            }
          : prev
      );
    });

    return unsubscribe;
  }, []);

  // Manejador cuando se elige un producto desde el buscador o desde el modal de info
  const handleProductSelected = (prod: Product) => {
    if (!prod.presentations || prod.presentations.length === 0) {
      showNotification('❌ Este producto no tiene presentaciones activas.');
      return;
    }

    if (prod.presentations.length === 1) {
      setSelectedProduct(prod);
      setSelectedPresentation(prod.presentations[0]);
    } else {
      setSelectedProduct(prod);
      setSelectedPresentation(null);
    }
  };

  // Envoltura que intercepta cuando se intenta crear una pestaña y abre el modal si se llegó al límite
  const handleCreateNewTab = (type: 'SALE' | 'QUOTE'): boolean => {
    const success = createNewTab(type);
    if (!success) {
      setShowTabLimitModal(true);
    }
    return success;
  };

  // ============================================================================
  // ATAJOS DE TECLADO GLOBALES (F1, F2, F3, F4, F8/F12, F9)
  // ============================================================================
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // SALIDA DE EMERGENCIA: PONER EN ESPERA Y ATENDER SIGUIENTE [F9]
      if (e.key === 'F9') {
        e.preventDefault();
        if (checkoutStep !== 'NONE') {
          setCheckoutStep('NONE');
        }
        if (activeTab.items.length > 0) {
          if (Date.now() - lastTabCreateTime.current < 300) return;
          lastTabCreateTime.current = Date.now();
          createNewTab('SALE');
          showNotification(`⏳ "${activeTab.title}" en espera. Atendiendo nueva cuenta...`);
        }
        return;
      }

      // Ignorar el resto de atajos si hay un modal crítico abierto
      if (checkoutStep !== 'NONE' || showSwitchModal || showClearModal || showCloseAllModal || showTabLimitModal || selectedProduct || infoProduct) return;

      if (e.key === 'F1') {
        e.preventDefault();
        if (Date.now() - lastTabCreateTime.current < 300) return;
        lastTabCreateTime.current = Date.now();
        handleCreateNewTab('SALE');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (Date.now() - lastTabCreateTime.current < 300) return;
        lastTabCreateTime.current = Date.now();
        handleCreateNewTab('QUOTE');
      } else if (e.key === 'F3') {
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
      } else if (e.key === 'F8' || e.key === 'F12') {
        e.preventDefault();
        if (activeTab.type === 'SALE' && activeTab.items.length > 0) {
          setCheckoutStep('SELECT_METHOD');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [checkoutStep, showSwitchModal, showClearModal, showCloseAllModal, showTabLimitModal, selectedProduct, infoProduct, activeTab.items.length, activeTab.type, createNewTab]);

  const handleConfirmAdd = (qty: number) => {
    if (!selectedProduct || !selectedPresentation) return;

    const existingInRow = activeTab.items.find(
      (i) => i.productId === selectedProduct.id && i.presentationId === selectedPresentation.id
    );
    const existingBaseInRow = existingInRow ? existingInRow.quantity * existingInRow.stockFactor : 0;
    const freeOnShelf = selectedProduct.availableStock ?? selectedProduct.currentStock;

    addItemToCart({
      productId: selectedProduct.id,
      presentationId: selectedPresentation.id,
      internalCode: selectedPresentation.code || selectedProduct.internalCode,
      barcode: selectedPresentation.barcode || selectedProduct.barcode,
      name: selectedProduct.name,
      presentationName: selectedPresentation.name,
      unitPrice: selectedPresentation.price,
      stockFactor: selectedPresentation.stockFactor,
      maxStock: freeOnShelf + existingBaseInRow,
      isInventoryTracked: selectedProduct.isInventoryTracked,
      allowFractions: selectedProduct.allowFractions,
      brand: selectedProduct.brand,
      location: selectedProduct.location,
      unitOfMeasure: selectedProduct.unitOfMeasure
    } as any, qty);
    setSelectedProduct(null);
    setSelectedPresentation(null);
  };

  // CÁLCULO DE TOTAL
  const grossSum = activeTab.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const totalAmount = Math.max(0, grossSum - (activeTab.discount || 0));

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

    const payload = {
      paymentMethod: API_PAYMENT_METHODS[activeTab.paymentMethod],
      paymentReference: referenceOrReceived.toString(),
      connectionId: inventoryHubService.getConnectionId(),
      details: activeTab.items.map(item => ({
        presentationId: item.presentationId,
        quantity: item.quantity
      }))
    };

    const response = await saleService.createSale(user.token, payload);
    setIsProcessingSale(false);

    if (response && response.success) {
      setLastSaleData(response.data);
      setCheckoutStep('SUCCESS');
    } else {
      showNotification(`❌ Error: ${response?.message || 'No se pudo registrar la venta.'}`);
    }
  };

  const handleDismissSuccess = () => {
    setCheckoutStep('NONE');
    setLastSaleData(null);
    clearActiveTabItems();
    setClientName('Público en General');
    setPaymentMethod('CASH');
  };

  return (
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

      {/* 2. BUSCADOR DESACOPLADO CON AUTO-SCROLL Y REF F3 */}
      <PosSearchBar
        ref={searchInputRef}
        onSelectProduct={handleProductSelected}
        onShowInfo={(prod) => setInfoProduct(prod)}
      />

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
            handleProductSelected(prod);
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