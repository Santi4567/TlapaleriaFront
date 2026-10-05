// src/components/pendingOrders/PlaceOrderModal.tsx
import React, { useState, useEffect} from 'react';
import { useAuth } from '../../context/AuthContext';
import { pendingOrderService } from '../../services/pendingOrderService';
import { PendingOrder } from '../../types/pendingOrder';

interface PlaceOrderModalProps {
  isOpen: boolean;
  supplierId: number | null;
  // AHORA ACEPTA UN BOOLEANO PARA SABER SI DEBE RECARGAR
  onClose: (hasChanges?: boolean) => void; 
}

const PlaceOrderModal: React.FC<PlaceOrderModalProps> = ({ isOpen, supplierId, onClose }) => {
  const { user } = useAuth();
  const token = (user as any)?.token || '';

  const [ordersList, setOrdersList] = useState<PendingOrder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // RASTREO LOCAL DE ESTADOS (0 = Pendiente, 1 = Pedido, 2 = Cancelado)
  const [localStatuses, setLocalStatuses] = useState<Record<number, number>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Función centralizada para cerrar el modal avisando si hubo cambios
  const handleClose = () => {
    const hasChanges = Object.keys(localStatuses).length > 0;
    onClose(hasChanges);
  };

  // ================= CARGA DE DATOS DESDE LA API =================
  useEffect(() => {
    if (isOpen && supplierId && token) {
      const loadOrders = async () => {
        setIsLoading(true);
        // Filtramos por estado 0 (Pendientes) y el proveedor seleccionado
        const response = await pendingOrderService.getPendingOrders(token, 0, 1, 100, undefined, supplierId);
        
        if (response && response.success) {
          const fetchedOrders = Array.isArray(response.data) ? response.data : (response.data.data || []);
          setOrdersList(fetchedOrders);
        } else {
          setOrdersList([]);
        }
        
        setCurrentIndex(0);
        setLocalStatuses({});
        setShowCancelConfirm(false);
        setShowExitConfirm(false);
        setIsLoading(false);
      };
      
      loadOrders();
    }
  }, [isOpen, supplierId, token]);

  const currentOrder = ordersList[currentIndex];

  const getDisplayData = (order: PendingOrder) => {
    if (order.product) {
      return { 
        code: order.product.internalCode || 'S/C', 
        name: order.product.name, 
        brand: order.product.brand || 'S/M' 
      };
    } else if (order.newProductName) {
      const parts = order.newProductName.split(' | ');
      return { 
        code: parts[0] || 'S/C', 
        name: parts[1] || order.newProductName, 
        brand: parts[2] || 'S/M' 
      };
    }
    return { code: '', name: 'Producto Desconocido', brand: '' };
  };

  const displayData = currentOrder ? getDisplayData(currentOrder) : null;

  // ================= ACCIONES A LA API =================
  const handleNext = async () => {
    if (!currentOrder || isSubmitting) return;
    setIsSubmitting(true);
    
    const response = await pendingOrderService.changeOrderStatus(token, currentOrder.id, 1);
    if (response && response.success) {
      setLocalStatuses(prev => ({ ...prev, [currentOrder.id]: 1 })); 
      advanceToNext();
    } else {
      alert("Error al intentar cambiar el estado del pedido.");
    }
    
    setIsSubmitting(false);
  };

  const handleCancelOrder = async () => {
    if (!currentOrder || isSubmitting) return;
    setIsSubmitting(true);
    
    const response = await pendingOrderService.changeOrderStatus(token, currentOrder.id, 2);
    if (response && response.success) {
      setLocalStatuses(prev => ({ ...prev, [currentOrder.id]: 2 })); 
      setShowCancelConfirm(false);
      advanceToNext();
    } else {
      alert("Error al intentar cancelar el pedido.");
    }
    
    setIsSubmitting(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isSubmitting) {
      setCurrentIndex(prev => prev - 1);
      setShowCancelConfirm(false);
    }
  };

  const advanceToNext = () => {
    setShowCancelConfirm(false);
    setCurrentIndex(prev => prev + 1);
  };

  const getProgressPercentage = () => {
    if (ordersList.length === 0) return 0;
    const processedCount = Object.keys(localStatuses).length;
    return (processedCount / ordersList.length) * 100;
  };

  // ================= ATAJOS DE TECLADO =================
  useEffect(() => {
    if (!isOpen || isSubmitting) return;
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (showExitConfirm || showCancelConfirm) {
        if (e.key === 'Escape') { 
          e.preventDefault(); 
          setShowExitConfirm(false); 
          setShowCancelConfirm(false); 
        }
        return;
      }

      if (!currentOrder) return;

      if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); setShowCancelConfirm(true); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowExitConfirm(true); }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isOpen, currentOrder, showExitConfirm, showCancelConfirm, onClose, localStatuses, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl w-full max-w-[1200px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[85vh] relative">
        
        {/* ================= MODAL FLOTANTE DE CONFIRMACIÓN DE SALIDA ================= */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-[#161618] border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/30">⚠️</div>
              <h3 className="text-xl font-black text-white mb-2">¿Deseas salir de Levantar Pedidos?</h3>
              <p className="text-gray-400 text-sm mb-6">Los cambios realizados hasta el momento ya se guardaron en la base de datos.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3.5 bg-[#1c1c1e] hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors">
                  Continuar aquí
                </button>
                <button onClick={handleClose} className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors shadow-lg">
                  Sí, Salir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= CABECERA ================= */}
        <div className="p-6 border-b border-gray-800 shrink-0 relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-wide">Levantar Pedidos</h3>
              </div>
            </div>
            
            <button onClick={() => setShowExitConfirm(true)} className="w-10 h-10 rounded-full bg-[#1c1c1e] hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex items-center gap-4 pl-16">
            <div className="w-48 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#a855f7] h-1.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {Object.keys(localStatuses).length} DE {ordersList.length} PROCESADOS
            </span>
          </div>
        </div>

        {/* ================= CONTENEDOR MASTER-DETAIL ================= */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LADO IZQUIERDO: SIDEBAR */}
          <div className="w-[340px] border-r border-gray-800 bg-[#0a0a0a] flex flex-col">
            <div className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Lista de Faltantes</div>
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-purple-500">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
            ) : ordersList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
                <span className="text-4xl mb-3">👻</span>
                <span className="text-gray-400 font-bold text-sm">No hay pendientes con este proveedor.</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
                {ordersList.map((order, idx) => {
                  const isActive = idx === currentIndex;
                  const display = getDisplayData(order);
                  const status = localStatuses[order.id] || 0; 
                  
                  let statusBadge = null;
                  if (status === 1) statusBadge = <span className="text-[9px] bg-[#a855f7]/20 text-[#a855f7] px-2 py-1 rounded-md font-black flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> PEDIDO</span>;
                  if (status === 2) statusBadge = <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-black flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> CANCELADO</span>;

                  return (
                    <div 
                      key={order.id}
                      onClick={() => { setCurrentIndex(idx); setShowCancelConfirm(false); }}
                      className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                        isActive 
                          ? 'bg-[#121212] border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                          : 'bg-[#121212] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 font-bold">{display.code}</span>
                        {statusBadge}
                      </div>
                      <div className={`font-bold text-sm transition-colors ${
                        status !== 0 ? 'text-gray-600 line-through' : (isActive ? 'text-white' : 'text-gray-300')
                      }`}>
                        {display.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LADO DERECHO: DETALLE DEL PRODUCTO */}
          <div className="flex-1 flex flex-col bg-[#121212] relative overflow-hidden">
            
            {!currentOrder && !isLoading ? (
              // PANTALLA FINALIZADO
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-300">
                 <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 border border-green-500/30">✅</div>
                 <h2 className="text-3xl font-black text-white mb-2">¡Lista Terminada!</h2>
                 <p className="text-gray-400 mb-8 font-medium max-w-sm">Has llegado al final de la lista. Revisa la barra lateral si necesitas corregir algo.</p>
                 <button onClick={handleClose} className="bg-[#a855f7] hover:bg-purple-500 text-white font-bold py-4 px-12 rounded-xl transition-colors">Finalizar Tarea</button>
              </div>
            ) : currentOrder && (
              // VISTA DE DETALLE
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col">
                  
                  {/* Clave y Marca */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[#a855f7] text-sm font-mono font-bold bg-[#a855f7]/10 px-2 py-0.5 rounded">{displayData!.code}</span>
                    <span className="text-gray-700 font-black">•</span>
                    <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">{displayData!.brand}</span>
                  </div>
                  
                  {/* Nombre Gigante */}
                  <h1 className="text-4xl font-extrabold text-white mb-8 leading-tight">
                    {displayData!.name}
                  </h1>

                  {/* INFO DE INVENTARIO (Solo si aplica) */}
                  {currentOrder.product?.isInventoryTracked && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#161618] border border-gray-800 rounded-2xl p-5 flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Stock Actual</span>
                        <span className="text-white font-black text-3xl">{currentOrder.product.currentStock}</span>
                      </div>
                      <div className="bg-[#161618] border border-gray-800 rounded-2xl p-5 flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ubicación Física</span>
                        <span className="text-white font-bold text-lg leading-tight mt-auto">{currentOrder.product.location || 'No asignada'}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Caja de Cantidad */}
                  <div className="relative bg-[#161618] border border-gray-800/80 rounded-2xl p-8 flex items-center justify-between mb-8">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#a855f7] rounded-l-2xl shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-4">Cantidad a Solicitar</span>
                    <span className="text-6xl font-black text-white">{currentOrder.quantityText}</span>
                  </div>

                  {/* Caja de Nota */}
                  {currentOrder.notes && (
                    <div className="mt-auto bg-[#1a160d] border border-yellow-700/50 rounded-2xl p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">📌</span>
                        <h4 className="text-yellow-500 font-black uppercase tracking-widest text-xs">Nota Importante</h4>
                      </div>
                      <p className="text-yellow-500/90 italic text-xl font-medium">
                        "{currentOrder.notes}"
                      </p>
                    </div>
                  )}

                </div>

                {/* ================= ACTION BAR ================= */}
                <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] shrink-0">
                  {showCancelConfirm ? (
                    <div className="flex items-center justify-between bg-red-900/20 border border-red-500/30 p-4 rounded-2xl animate-in slide-in-from-bottom-2 duration-200">
                      <div className="px-2 text-red-400 font-bold flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        ¿Descartar este pedido permanentemente?
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowCancelConfirm(false)} disabled={isSubmitting} className="px-6 py-3 bg-[#1c1c1e] hover:bg-gray-800 text-gray-300 font-bold rounded-xl transition-colors flex items-center gap-2">
                          No, volver <kbd className="bg-black text-gray-500 px-1.5 py-0.5 rounded border border-gray-700 text-[10px]">Esc</kbd>
                        </button>
                        <button onClick={handleCancelOrder} disabled={isSubmitting} className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black rounded-xl transition-colors flex items-center gap-2">
                          Sí, Cancelar {isSubmitting ? '...' : <kbd className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">Enter ↵</kbd>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={handlePrev}
                        disabled={currentIndex === 0 || isSubmitting}
                        className="flex items-center gap-3 px-6 py-4 bg-[#1c1c1e] hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-[#1c1c1e] text-gray-300 rounded-xl font-bold transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Regresar
                        <kbd className="bg-black text-gray-500 px-1.5 py-0.5 rounded border border-gray-700 text-[10px]">←</kbd>
                      </button>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={isSubmitting}
                          className="flex items-center gap-3 px-6 py-4 bg-[#1c1c1e] border border-gray-800 hover:border-red-900/50 hover:bg-red-900/10 text-gray-400 hover:text-red-400 disabled:opacity-50 rounded-xl font-bold transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          Cancelar Faltante
                          <kbd className="bg-black text-gray-500 px-1.5 py-0.5 rounded border border-gray-700 text-[10px]">Del</kbd>
                        </button>

                        <button 
                          onClick={handleNext}
                          disabled={isSubmitting}
                          className="flex items-center gap-3 px-8 py-4 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-xl font-black transition-colors shadow-[0_0_25px_rgba(168,85,247,0.4)]"
                        >
                          Siguiente (Hacer Pedido)
                          {isSubmitting ? '...' : <kbd className="bg-black/20 text-white px-1.5 py-0.5 rounded border border-transparent text-[10px]">Enter ↵</kbd>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderModal;