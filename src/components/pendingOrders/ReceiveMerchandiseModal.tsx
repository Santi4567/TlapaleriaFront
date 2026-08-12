// src/components/pendingOrders/ReceiveMerchandiseModal.tsx
import React, { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pendingOrderService } from '../../services/pendingOrderService';
import { PendingOrder } from '../../types/pendingOrder';

interface ReceiveMerchandiseModalProps {
  isOpen: boolean;
  supplierId: number | null;
  onClose: (hasChanges?: boolean) => void;
}

const ReceiveMerchandiseModal: React.FC<ReceiveMerchandiseModalProps> = ({ isOpen, supplierId, onClose }) => {
  const { user } = useAuth();
  const token = (user as any)?.token || '';

  const [ordersList, setOrdersList] = useState<PendingOrder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // RASTREO LOCAL (3 = Completado, 0 = Faltó/Pendiente, 2 = Cancelado)
  const [localStatuses, setLocalStatuses] = useState<Record<number, number>>({});
  
  // ================= ESTADOS DEL FORMULARIO =================
  const [receivedQty, setReceivedQty] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
  
  // Estados de Precios
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newSupplierPrice, setNewSupplierPrice] = useState('');
  const [newProfitMargin, setNewProfitMargin] = useState('');
  const [newPresentationPrices, setNewPresentationPrices] = useState<Record<number, string>>({});

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const supplierPriceInputRef = useRef<HTMLInputElement>(null);

  // ================= CARGA DE DATOS (ESTADO 1 = PEDIDOS) =================
  useEffect(() => {
    if (isOpen && supplierId && token) {
      const loadOrders = async () => {
        setIsLoading(true);
        // Filtramos por estado 1 (Pedidos en tránsito)
        const response = await pendingOrderService.getPendingOrders(token, 1, 1, 100, undefined, supplierId);
        if (response && response.success) {
          const fetchedOrders = Array.isArray(response.data) ? response.data : (response.data.data || []);
          setOrdersList(fetchedOrders);
        } else {
          setOrdersList([]);
        }
        setCurrentIndex(0);
        setLocalStatuses({});
        setShowExitConfirm(false);
        setIsLoading(false);
      };
      loadOrders();
    }
  }, [isOpen, supplierId, token]);

  const currentOrder = ordersList[currentIndex];

  // Resetear el formulario al cambiar de producto
  useEffect(() => {
    if (currentOrder) {
      setReceivedQty('');
      setMovementNotes('');
      setIsEditingPrice(false);
      setNewSupplierPrice(currentOrder.product?.supplierPrice?.toString() || '');
      setNewProfitMargin(currentOrder.product?.profitMargin?.toString() || '');
      setNewPresentationPrices({});
      
      // Auto-focus inteligente
      if (currentOrder.product?.isInventoryTracked) {
        setTimeout(() => qtyInputRef.current?.focus(), 150);
      } else {
        setTimeout(() => document.getElementById('movementNotesInput')?.focus(), 150);
      }
    }
  }, [currentIndex, currentOrder]);

  const getDisplayData = (order: PendingOrder) => {
    if (order.product) return { code: order.product.internalCode || 'S/C', name: order.product.name, brand: order.product.brand || 'S/M', hasProduct: true };
    if (order.newProductName) {
      const parts = order.newProductName.split(' | ');
      return { code: parts[0] || 'S/C', name: parts[1] || order.newProductName, brand: parts[2] || 'S/M', hasProduct: false };
    }
    return { code: '', name: 'Desconocido', brand: '', hasProduct: false };
  };
  const displayData = currentOrder ? getDisplayData(currentOrder) : null;

  // ================= LÓGICA DE PRECIOS =================
  const calculatePrices = () => {
    const cost = parseFloat(newSupplierPrice);
    const margin = parseFloat(newProfitMargin);
    if (isNaN(cost) || cost <= 0 || isNaN(margin)) return;

    const marginMultiplier = 1 + (margin / 100); 
    const presentations = currentOrder.product?.presentations;

    if (presentations && presentations.length > 0) {
      const maxFactor = Math.max(...presentations.map(p => p.stockFactor));
      const costPerUnit = cost / maxFactor; 

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
      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isIncrease ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
        {isIncrease ? '▲' : '▼'} {Math.abs(percentChange).toFixed(1)}%
      </span>
    );
  };

  // ================= ACCIONES A LA API =================
  const processReceipt = async (finalStatus: number) => {
    if (!currentOrder || isSubmitting) return;

    // Validación si va a completarlo y es inventariable
    if (finalStatus === 3 && currentOrder.product?.isInventoryTracked && !receivedQty.trim()) {
      alert("Debes ingresar las piezas que llegaron.");
      qtyInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    // CONSTRUCCIÓN DEL JSON BASADO EN TUS CASOS (A - F)
    const payload: any = {
      finalStatus: finalStatus,
      movementNotes: movementNotes.trim() || undefined
    };

    if (finalStatus === 3) {
      // Caso A y D: Cantidad (Solo si es inventariable)
      if (currentOrder.product?.isInventoryTracked) {
        payload.receivedQuantity = parseFloat(receivedQty);
      } else {
        payload.receivedQuantity = null;
      }

      // Casos B y C: Cambios de precios
      if (isEditingPrice) {
        const oldSupplierPrice = currentOrder.product?.supplierPrice;
        const oldMargin = currentOrder.product?.profitMargin;
        const parsedNewCost = parseFloat(newSupplierPrice);
        const parsedNewMargin = parseFloat(newProfitMargin);

        if (!isNaN(parsedNewCost) && parsedNewCost !== oldSupplierPrice) payload.newSupplierPrice = parsedNewCost;
        if (!isNaN(parsedNewMargin) && parsedNewMargin !== oldMargin) payload.newProfitMargin = parsedNewMargin;

        const pPrices: any[] = [];
        Object.entries(newPresentationPrices).forEach(([id, price]) => {
          const parsedPrice = parseFloat(price);
          const originalPres = currentOrder.product?.presentations?.find(p => p.id === Number(id));
          if (!isNaN(parsedPrice) && originalPres && originalPres.price !== parsedPrice) {
            pPrices.push({ presentationId: Number(id), newPrice: parsedPrice });
          }
        });
        
        if (pPrices.length > 0) payload.presentationPrices = pPrices;
      }
    }

    // Llama al servicio (Asegúrate de haber creado este método en tu pendingOrderService)
    const response = await pendingOrderService.processMerchandiseReceipt(token, currentOrder.id, payload);
    
    if (response && response.success) {
      setLocalStatuses(prev => ({ ...prev, [currentOrder.id]: finalStatus })); 
      advanceToNext();
    } else {
      alert("Error al procesar la recepción del pedido.");
    }
    
    setIsSubmitting(false);
  };

  const advanceToNext = () => {
    if (currentIndex < ordersList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isSubmitting) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    const hasChanges = Object.keys(localStatuses).length > 0;
    onClose(hasChanges);
  };

  const getProgressPercentage = () => {
    if (ordersList.length === 0) return 0;
    const processedCount = Object.keys(localStatuses).length;
    return (processedCount / ordersList.length) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl w-full max-w-[1250px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[90vh] relative">
        
        {/* ================= MODAL DE SALIDA ================= */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-[#161618] border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/30">⚠️</div>
              <h3 className="text-xl font-black text-white mb-2">¿Salir de Recepción?</h3>
              <p className="text-gray-400 text-sm mb-6">Los productos que ya procesaste están guardados.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3.5 bg-[#1c1c1e] hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors">Continuar aquí</button>
                <button onClick={handleClose} className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors shadow-lg">Sí, Salir</button>
              </div>
            </div>
          </div>
        )}

        {/* ================= CABECERA AZUL ================= */}
        <div className="p-6 border-b border-gray-800 shrink-0 relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              </div>
              <div><h3 className="text-2xl font-bold text-white tracking-wide">Recepción de Mercancía</h3></div>
            </div>
            <button onClick={() => setShowExitConfirm(true)} className="w-10 h-10 rounded-full bg-[#1c1c1e] hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex items-center gap-4 pl-16">
            <div className="w-48 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{Object.keys(localStatuses).length} DE {ordersList.length} PROCESADOS</span>
          </div>
        </div>

        {/* ================= MASTER-DETAIL ================= */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LADO IZQUIERDO: SIDEBAR */}
          <div className="w-[340px] border-r border-gray-800 bg-[#0a0a0a] flex flex-col">
            <div className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Pedidos en Tránsito</div>
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-blue-500"><svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
            ) : ordersList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
                <span className="text-4xl mb-3">📦</span><span className="text-gray-400 font-bold text-sm">No hay mercancía pendiente de recibir de este proveedor.</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
                {ordersList.map((order, idx) => {
                  const isActive = idx === currentIndex;
                  const display = getDisplayData(order);
                  const status = localStatuses[order.id]; 
                  
                  let statusBadge = null;
                  if (status === 3) statusBadge = <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-black flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> RECIBIDO</span>;
                  if (status === 0) statusBadge = <span className="text-[9px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md font-black flex items-center gap-1">FALTÓ</span>;
                  if (status === 2) statusBadge = <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-black flex items-center gap-1">CANCELADO</span>;

                  return (
                    <div key={order.id} onClick={() => setCurrentIndex(idx)} className={`p-4 rounded-2xl cursor-pointer border transition-all ${isActive ? 'bg-[#121212] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-[#121212] border-gray-800 hover:border-gray-700'}`}>
                      <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500 font-bold">{display.code}</span>{statusBadge}</div>
                      <div className={`font-bold text-sm transition-colors ${status !== undefined ? 'text-gray-600 line-through' : (isActive ? 'text-white' : 'text-gray-300')}`}>{display.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LADO DERECHO: DETALLE Y ACCIONES */}
          <div className="flex-1 flex flex-col bg-[#121212] relative overflow-hidden">
            
            {!currentOrder && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-300">
                 <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 border border-green-500/30">✅</div>
                 <h2 className="text-3xl font-black text-white mb-2">¡Recepción Terminada!</h2>
                 <button onClick={handleClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-xl mt-8">Cerrar Ventana</button>
              </div>
            ) : currentOrder && displayData && (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                  
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-blue-400 text-sm font-mono font-bold bg-blue-500/10 px-2 py-0.5 rounded">{displayData.code}</span>
                    <span className="text-gray-700 font-black">•</span>
                    <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">{displayData.brand}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white mb-6 leading-tight">{displayData.name}</h1>
                  
                  {!displayData.hasProduct && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                      ⚠️ Este encargo especial aún no ha sido dado de alta en el catálogo. No podrás marcarlo como Recibido (Completado) hasta que lo registres.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* COLUMNA IZQ: CANTIDAD Y NOTAS */}
                    <div className="space-y-6">
                      <div className="bg-[#161618] border border-gray-800 rounded-2xl p-5 flex justify-between items-center shadow-inner">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Pedido Original</span>
                        <span className="text-white font-black text-3xl">{currentOrder.quantityText}</span>
                      </div>

                      <div>
                        <label className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <span className="bg-blue-500 text-black px-1.5 py-0.5 rounded text-[10px]">▶</span> Piezas que llegaron
                        </label>
                        <input 
                          ref={qtyInputRef} 
                          type={!currentOrder.product?.isInventoryTracked ? "text" : "number"}
                          value={!currentOrder.product?.isInventoryTracked ? '' : receivedQty} 
                          onChange={(e) => setReceivedQty(e.target.value)} 
                          disabled={!currentOrder.product?.isInventoryTracked} 
                          className={`w-full border-2 font-black rounded-xl py-4 px-6 outline-none transition-colors 
                            ${!currentOrder.product?.isInventoryTracked ? 'bg-[#0a0a0a] border-gray-800 text-gray-500 cursor-not-allowed text-center text-sm' : 'bg-[#121212] border-gray-700 text-white text-3xl focus:border-blue-500 shadow-inner'}
                          `} 
                          placeholder={!currentOrder.product?.isInventoryTracked ? "Producto no inventariable" : "0"}
                        />
                      </div>

                      <div>
                         <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notas de Recepción (Opcional)</label>
                         <textarea id="movementNotesInput" value={movementNotes} onChange={(e) => setMovementNotes(e.target.value)} className="w-full bg-[#121212] border-2 border-gray-800 text-white rounded-xl p-4 outline-none focus:border-gray-500 resize-none h-24 custom-scrollbar text-sm" placeholder="Ej. Llegó una pieza rota..." />
                      </div>
                    </div>

                    {/* COLUMNA DER: PRECIOS */}
                    {displayData.hasProduct && currentOrder.product && (
                      <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl p-6 relative flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Costos y Precios</h3>
                          {!isEditingPrice && (
                            <button onClick={() => { setIsEditingPrice(true); setTimeout(() => supplierPriceInputRef.current?.focus(), 100); }} className="text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                              ✎ Actualizar
                            </button>
                          )}
                        </div>

                        {!isEditingPrice ? (
                          <div className="flex flex-col flex-1 justify-center space-y-6">
                            <div className="text-center">
                              <span className="block text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Costo Proveedor Actual</span>
                              <span className="text-white font-black text-4xl">${currentOrder.product.supplierPrice?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precios Público</span>
                                <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded font-bold">Ganancia: {currentOrder.product.profitMargin}%</span>
                              </div>
                              <div className="space-y-2">
                                {currentOrder.product.presentations?.map(pres => (
                                  <div key={pres.id} className="bg-[#121212] p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                                    <span className="text-gray-400 font-bold text-xs">{pres.name}</span>
                                    <span className="text-white font-black text-lg">${pres.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="animate-in fade-in duration-200">
                            <div className="flex gap-3 mb-4">
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-blue-400 uppercase mb-1">Nuevo Costo ($)</label>
                                <input ref={supplierPriceInputRef} type="number" step="0.01" value={newSupplierPrice} onChange={(e) => setNewSupplierPrice(e.target.value)} className="w-full bg-[#121212] border border-blue-500/50 text-white font-bold text-lg rounded-lg py-2 px-3 outline-none focus:border-blue-500" />
                              </div>
                              <div className="w-24">
                                <label className="block text-[10px] font-black text-blue-400 uppercase mb-1">Margen (%)</label>
                                <input type="number" step="1" value={newProfitMargin} onChange={(e) => setNewProfitMargin(e.target.value)} className="w-full bg-[#121212] border border-blue-500/50 text-white font-bold text-lg rounded-lg py-2 px-3 outline-none focus:border-blue-500" />
                              </div>
                            </div>
                            <button onClick={calculatePrices} className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold py-2 rounded-lg transition-colors text-xs border border-blue-500/30 mb-4">
                              🖩 Recalcular Sugeridos
                            </button>

                            <div className="border-t border-gray-800 pt-4 space-y-2">
                              {currentOrder.product.presentations?.map(pres => (
                                <div key={pres.id} className="bg-[#121212] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-gray-400 font-bold text-[10px] leading-tight">{pres.name}</span>
                                    {renderPriceChangeBadge(pres.price, newPresentationPrices[pres.id] || '')}
                                  </div>
                                  <div className="w-28 relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input type="number" step="0.01" value={newPresentationPrices[pres.id] || ''} onChange={(e) => setNewPresentationPrices({...newPresentationPrices, [pres.id]: e.target.value})} className="w-full bg-black/50 border border-gray-700 text-white font-bold text-sm rounded-md py-1 pl-6 pr-2 outline-none focus:border-blue-500" placeholder={pres.price.toString()} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= BOTONES INFERIORES ================= */}
                <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] shrink-0 flex justify-between items-center">
                  <button onClick={handlePrev} disabled={currentIndex === 0 || isSubmitting} className="flex items-center gap-2 px-6 py-4 bg-[#1c1c1e] hover:bg-gray-800 disabled:opacity-30 text-gray-300 rounded-xl font-bold transition-colors">
                    <kbd className="bg-black text-gray-500 px-1.5 py-0.5 rounded border border-gray-700 text-[10px]">←</kbd> Regresar
                  </button>

                  <div className="flex gap-3">
                    <button onClick={() => processReceipt(2)} disabled={isSubmitting} className="px-6 py-4 bg-[#1c1c1e] border border-gray-800 hover:bg-red-900/20 text-gray-400 hover:text-red-400 disabled:opacity-50 rounded-xl font-bold transition-colors">
                      Cancelar ✗
                    </button>
                    <button onClick={() => processReceipt(0)} disabled={isSubmitting} className="px-6 py-4 bg-[#1c1c1e] border border-gray-800 hover:bg-orange-900/20 text-gray-400 hover:text-orange-400 disabled:opacity-50 rounded-xl font-bold transition-colors">
                      Faltó (Pendiente) ⏳
                    </button>
                    <button onClick={() => processReceipt(3)} disabled={isSubmitting || !displayData.hasProduct} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                      Recibir Mercancía ✓
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ReceiveMerchandiseModal;