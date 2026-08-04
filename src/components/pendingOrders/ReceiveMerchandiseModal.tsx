// src/components/pendingOrders/ReceiveMerchandiseModal.tsx
import React, { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';

// ================= MOCK DATA (BASADO EN TU JSON REAL) =================
const MOCK_PENDING_ORDERS = [
  { 
    id: 101, supplierId: 1, 
    product: { 
      id: 2, internalCode: 'CAB-12-R', name: 'Cable THW Calibre 12 Rojo', 
      supplierPrice: 900, profitMargin: 35, unitOfMeasure: 'METRO',
      isInventoryTracked: true, allowFractions: true,
      presentations: [
        { id: 4, name: 'Metro', price: 15, stockFactor: 1 },
        { id: 5, name: 'Rollo 100m', price: 1350, stockFactor: 100 }
      ]
    }, 
    requestedQty: '10'
  },
  { 
    id: 102, supplierId: 1, 
    product: { 
      id: 3, internalCode: 'CEM-CA-50', name: 'Cemento Gris Cruz Azul 50kg', 
      supplierPrice: 150, profitMargin: 20, unitOfMeasure: 'BULTO',
      isInventoryTracked: true, allowFractions: false,
      presentations: [
        { id: 6, name: 'Bulto 50kg', price: 180, stockFactor: 1 }
      ]
    }, 
    requestedQty: '50'
  },
  { 
    id: 103, supplierId: 1, 
    product: { 
      id: 4, internalCode: 'BRO-2', name: 'Brocha de 2 pulgadas', 
      supplierPrice: 15, profitMargin: 40, unitOfMeasure: 'PIEZA',
      isInventoryTracked: false, allowFractions: false,
      presentations: [
        { id: 7, name: 'Pieza', price: 25, stockFactor: 1 }
      ]
    }, 
    requestedQty: '20'
  }
];

interface ReceiveMerchandiseModalProps {
  isOpen: boolean;
  supplierId: number | null;
  onClose: () => void;
}

const ReceiveMerchandiseModal: React.FC<ReceiveMerchandiseModalProps> = ({ isOpen, supplierId, onClose }) => {
  const [ordersList, setOrdersList] = useState<typeof MOCK_PENDING_ORDERS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // ================= ESTADOS DE CAPTURA =================
  const [receivedQty, setReceivedQty] = useState('');
  
  // Estados para precios
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newSupplierPrice, setNewSupplierPrice] = useState('');
  const [newPresentationPrices, setNewPresentationPrices] = useState<Record<number, string>>({});

  // Referencias para foco
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const supplierPriceInputRef = useRef<HTMLInputElement>(null);

  // Inicializar al abrir
  useEffect(() => {
    if (isOpen && supplierId) {
      const supplierOrders = MOCK_PENDING_ORDERS.filter(o => o.supplierId === supplierId);
      setOrdersList(supplierOrders);
      setCurrentIndex(0);
      setIsFinished(supplierOrders.length === 0);
      resetCaptureFields();
      setTimeout(() => qtyInputRef.current?.focus(), 150);
    }
  }, [isOpen, supplierId]);

  const currentOrder = ordersList[currentIndex];

  const resetCaptureFields = () => {
    setReceivedQty('');
    setIsEditingPrice(false);
    setNewSupplierPrice('');
    setNewPresentationPrices({});
  };

  // ================= LÓGICA DE CÁLCULO DE PRECIOS =================
  const calculatePrices = () => {
    const cost = parseFloat(newSupplierPrice);
    if (isNaN(cost) || cost <= 0) return;

    const marginMultiplier = 1 + (currentOrder.product.profitMargin / 100); 
    const presentations = currentOrder.product.presentations;

    if (presentations && presentations.length > 0) {
      // 1. Encontrar el factor mayor (El "Padre" por el que se está pagando el supplierPrice)
      const maxFactor = Math.max(...presentations.map(p => p.stockFactor));
      
      // 2. Costo real por unidad mínima
      const costPerUnit = cost / maxFactor; 

      // 3. Calcular precio de venta sugerido para cada presentación
      const updatedPrices: Record<number, string> = {};
      presentations.forEach(pres => {
        const presCost = costPerUnit * pres.stockFactor;
        const presPublicPrice = presCost * marginMultiplier;
        updatedPrices[pres.id] = presPublicPrice.toFixed(2);
      });
      setNewPresentationPrices(updatedPrices);
    }
  };

  const renderPriceChangeBadge = (oldPrice: number, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice === oldPrice) return null;
    
    const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
    const isIncrease = percentChange > 0;
    
    return (
      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isIncrease ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
        {isIncrease ? '▲' : '▼'} {Math.abs(percentChange).toFixed(1)}%
      </span>
    );
  };

  // ================= NAVEGACIÓN Y ACCIONES =================
  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>, isPriceInput: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isPriceInput) {
        calculatePrices();
      } else {
        if (!isEditingPrice) handleNext('completado');
        else supplierPriceInputRef.current?.focus();
      }
    }
  };

  const handleQtyKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!currentOrder?.product.allowFractions && (e.key === '.' || e.key === ',')) {
      e.preventDefault();
    }
    handleInputKeyDown(e, false);
  };

  useEffect(() => {
    if (!isOpen || isFinished || !currentOrder) return;
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); handleSinCambios(); } 
      else if (e.key === 'F4') { e.preventDefault(); handleNext('pendiente'); } 
      else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isOpen, isFinished, currentOrder, onClose]);

  const handleSinCambios = () => {
    console.log(`Guardado SIN CAMBIOS: ${currentOrder.product.internalCode}`);
    advanceToNext();
  };

  const handleNext = (action: 'completado' | 'pendiente') => {
    if (action === 'completado') {
      console.log("Guardando manualmente...", { receivedQty, newSupplierPrice, newPresentationPrices });
    }
    advanceToNext();
  };

  const advanceToNext = () => {
    if (currentIndex < ordersList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetCaptureFields();
      setTimeout(() => qtyInputRef.current?.focus(), 100);
    } else {
      setIsFinished(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-gray-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* CABECERA */}
        <div className="p-6 border-b border-gray-800 bg-[#0a0a0a] shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center tracking-wide">
              <span className="text-blue-500 mr-2 bg-blue-500/10 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></span>
              Entrada de Mercancía
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          {!isFinished && (
             <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                  <span>Revisando Orden</span><span className="text-blue-400">Producto {currentIndex + 1} de {ordersList.length}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / ordersList.length) * 100}%` }}></div>
                </div>
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {isFinished ? (
            <div className="p-12 text-center flex-1 flex flex-col items-center justify-center animate-in zoom-in min-h-[400px]">
               <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 border-2 border-green-500/50">✅</div>
               <h2 className="text-2xl font-black text-white mb-2">¡Recepción Finalizada!</h2>
               <button onClick={onClose} className="mt-8 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-10 rounded-xl transition-colors">Cerrar Ventana</button>
            </div>
          ) : (
            currentOrder && (
              <div className="p-8 flex gap-6 animate-in slide-in-from-right-4 fade-in duration-300" key={currentOrder.id}>
                
                {/* ---------------- COLUMNA IZQUIERDA (CANTIDAD) ---------------- */}
                <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                  <span className="inline-block bg-black/50 text-orange-400 font-mono font-bold px-3 py-1 rounded-lg text-sm mb-4 w-fit border border-orange-500/20">{currentOrder.product.internalCode}</span>
                  <h2 className="text-3xl font-extrabold text-white mb-6 leading-tight">{currentOrder.product.name}</h2>
                  
                  <div className="bg-[#121212] p-5 rounded-2xl border border-gray-800 mb-6 flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Cantidad Pedida</span>
                    <span className="text-white font-black text-3xl">{currentOrder.requestedQty}</span>
                  </div>

                  <div className="mt-2">
                    <label className="block text-xs font-black text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded text-[10px]">▶</span> Piezas que llegaron *
                    </label>
                    <input 
                      ref={qtyInputRef} type="number" value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} onKeyDown={handleQtyKeyDown}
                      disabled={!currentOrder.product.isInventoryTracked} step={currentOrder.product.allowFractions ? "0.01" : "1"}
                      className={`w-full border-2 font-black text-4xl rounded-2xl py-4 px-6 outline-none transition-colors ${!currentOrder.product.isInventoryTracked ? 'bg-[#0a0a0a] border-gray-800 text-gray-600 cursor-not-allowed' : 'bg-[#121212] border-gray-700 text-white focus:border-orange-500 shadow-inner placeholder-gray-700'}`} 
                      placeholder={!currentOrder.product.isInventoryTracked ? "N/A" : "0"}
                    />
                    {!currentOrder.product.isInventoryTracked && <div className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-wider">ⓘ Inventario no rastreado.</div>}
                    {currentOrder.product.isInventoryTracked && !currentOrder.product.allowFractions && <div className="text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-wider">ⓘ Solo números enteros.</div>}
                  </div>
                </div>

                {/* ---------------- COLUMNA DERECHA (PRECIOS) ---------------- */}
                <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-3xl p-8 flex flex-col relative overflow-hidden custom-scrollbar overflow-y-auto">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  
                  <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                    <h3 className="text-lg font-bold text-gray-300 uppercase tracking-widest">Precios y Costos</h3>
                    {!isEditingPrice && (
                      <button onClick={() => { setIsEditingPrice(true); setTimeout(() => supplierPriceInputRef.current?.focus(), 100); }} className="text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                        ✎ Cambio de Precios
                      </button>
                    )}
                  </div>

                  {!isEditingPrice ? (
                    <div className="flex flex-col h-full justify-center space-y-6">
                      <div className="bg-[#121212] p-6 rounded-2xl border border-gray-800 text-center shadow-inner">
                        <span className="block text-xs text-gray-500 uppercase font-black tracking-widest mb-2">Costo Proveedor Actual</span>
                        <span className="text-white font-black text-5xl">${currentOrder.product.supplierPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="pt-4 mt-2">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precios Público Actuales</span>
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-bold">Ganancia Base: {currentOrder.product.profitMargin}%</span>
                        </div>
                        <div className="space-y-3">
                          {currentOrder.product.presentations?.map(pres => (
                            <div key={pres.id} className="bg-[#121212] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                              <span className="text-gray-300 font-bold">{pres.name}</span>
                              <span className="text-blue-400 font-black text-xl">${pres.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-300">
                      <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-5 mb-6">
                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">1. Ingresa Nuevo Costo Proveedor</label>
                        <div className="relative mb-3">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl">$</span>
                          <input 
                            ref={supplierPriceInputRef} type="number" step="0.01" value={newSupplierPrice} onChange={(e) => setNewSupplierPrice(e.target.value)} onKeyDown={(e) => handleInputKeyDown(e, true)}
                            className="w-full bg-[#121212] border-2 border-blue-500/50 text-white font-black text-2xl rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 shadow-inner placeholder-gray-700" placeholder={currentOrder.product.supplierPrice.toString()}
                          />
                        </div>
                        <button onClick={calculatePrices} disabled={!newSupplierPrice} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-2 rounded-xl transition-colors text-sm shadow-md">
                          🖩 Calcular Precios ({currentOrder.product.profitMargin}% Ganancia)
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">2. Precios al Público (Sugeridos)</label>
                        <div className="space-y-3">
                          {currentOrder.product.presentations?.map(pres => (
                            <div key={pres.id} className="bg-[#121212] p-3 rounded-xl border border-gray-800">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-white font-bold text-xs">{pres.name}</span>
                                {renderPriceChangeBadge(pres.price, newPresentationPrices[pres.id] || '')}
                              </div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm">$</span>
                                <input 
                                  type="number" step="0.01" value={newPresentationPrices[pres.id] || ''} onChange={(e) => setNewPresentationPrices({...newPresentationPrices, [pres.id]: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter') handleNext('completado'); }}
                                  className="w-full bg-black/50 border border-gray-700 text-blue-300 font-bold text-sm rounded-lg py-1.5 pl-7 pr-2 outline-none focus:border-blue-500" placeholder={`Actual: $${pres.price}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* ================= FOOTER DE ACCIONES RÁPIDAS ================= */}
        {!isFinished && (
          <div className="p-5 border-t border-gray-800 bg-[#0a0a0a] shrink-0 grid grid-cols-3 gap-4">
            <button onClick={() => handleNext('pendiente')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#121212] hover:bg-gray-800 border border-gray-700 text-gray-400 rounded-xl font-bold transition-all">
              <span>Faltó / Saltar</span><kbd className="bg-black px-2 py-0.5 rounded text-[10px] border border-gray-700">F4</kbd>
            </button>
            <button onClick={handleSinCambios} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#121212] hover:bg-blue-900/30 border border-blue-900 text-blue-400 rounded-xl font-bold transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span>Sin Cambios</span><kbd className="bg-blue-900/50 px-2 py-0.5 rounded text-[10px]">F2</kbd>
            </button>
            <button onClick={() => handleNext('completado')} className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black transition-all shadow-md">
              <span>Guardar Manual</span><kbd className="bg-black/30 px-2 py-0.5 rounded text-[10px]">Enter ↵</kbd>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReceiveMerchandiseModal;