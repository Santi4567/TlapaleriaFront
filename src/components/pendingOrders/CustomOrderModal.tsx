// src/components/pendingOrders/CustomOrderModal.tsx
import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService'; 
import { Supplier } from '../../types/supplier';
import { useAuth } from '../../context/AuthContext';
import { PendingOrder } from '../../types/pendingOrder';
import ConfirmActionModal from './ConfirmActionModal';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, isEdit: boolean) => Promise<boolean>; 
  onChangeStatus?: (id: number, status: number) => Promise<boolean>;
  initialData?: PendingOrder | null;
}

const CustomOrderModal: React.FC<CustomOrderModalProps> = ({ 
  isOpen, onClose, onSave, onChangeStatus, initialData 
}) => {
  const { user } = useAuth();
  const token = (user as any)?.token || '';
  const isEdit = !!initialData;

  const currentStatus = initialData?.status ?? 0; 
  const isReadOnly = currentStatus === 2 || currentStatus === 3; 
  const isPartialBlock = currentStatus === 1;

  const customProductInputRef = useRef<HTMLInputElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);
  const mensajeInputRef = useRef<HTMLTextAreaElement>(null);

  const [customProductName, setCustomProductName] = useState('');
  
  // ================= ESTADOS PARA ENLAZAR PRODUCTO =================
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [isProductFocused, setIsProductFocused] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);
  const [isProductLoading, setIsProductLoading] = useState(false);
  
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [fetchedSuppliers, setFetchedSuppliers] = useState<Supplier[]>([]);
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(0);
  
  const [cantidad, setCantidad] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || confirmModalOpen) return; 
    
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (isEdit && currentStatus === 0) {
        if (e.key === 'F2') {
          e.preventDefault();
          setStatusToConfirm(1);
          setConfirmModalOpen(true);
        } else if (e.key === 'F4') {
          e.preventDefault();
          setStatusToConfirm(2);
          setConfirmModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmModalOpen, isEdit, currentStatus, onClose]);

  // Manejo de datos iniciales
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustomProductName(initialData.newProductName || '');
        setSelectedSupplier(initialData.supplier || null);
        setCantidad(initialData.quantityText || '');
        setMensaje(initialData.notes || '');
        setSelectedProduct(initialData.product || null); 
        setTimeout(() => cantidadInputRef.current?.focus(), 100);
      } else {
        setCustomProductName('');
        setSupplierSearch(''); setSelectedSupplier(null); setFetchedSuppliers([]);
        setCantidad(''); setMensaje('');
        setSelectedProduct(null); setProductSearch('');
        setTimeout(() => customProductInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialData]);

  // ================= BUSCADOR DE PRODUCTO PARA ENLACE =================
  useEffect(() => {
    const fetchProducts = async () => {
      if (!productSearch.trim() || productSearch.length < 2) { setFetchedProducts([]); setIsProductLoading(false); return; }
      setIsProductLoading(true);
      const response = await productService.searchProducts(token, productSearch);
      if (response && response.success) setFetchedProducts(response.data.slice(0, 6)); else setFetchedProducts([]);
      setIsProductLoading(false);
    };
    const delayDebounceFn = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [productSearch, token]);

  const applyProductSelection = (prod: any) => {
    setSelectedProduct(prod); 
    setProductSearch(''); 
    setIsProductFocused(false); 
  };

  const handleProductKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isProductFocused || fetchedProducts.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedProductIndex(prev => (prev < fetchedProducts.length - 1 ? prev + 1 : prev)); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedProductIndex(prev => (prev > 0 ? prev - 1 : prev)); } 
    else if (e.key === 'Enter') { 
      e.preventDefault(); 
      const selected = fetchedProducts[highlightedProductIndex]; 
      if (selected) applyProductSelection(selected);
    }
  };

  // ================= BUSCADOR DE PROVEEDOR =================
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!supplierSearch.trim() || supplierSearch.length < 2) { setFetchedSuppliers([]); return; }
      const response = await supplierService.searchSuppliers(token, supplierSearch, true);
      if (response && response.success) setFetchedSuppliers(response.data.slice(0, 6)); else setFetchedSuppliers([]);
    };
    const delayDebounceFn = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearch, token]);

  const handleCustomProductKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customProductName.trim()) {
      e.preventDefault();
      setTimeout(() => supplierInputRef.current?.focus(), 100);
    }
  };

  const handleSupplierKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isSupplierFocused || fetchedSuppliers.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedSupplierIndex(prev => (prev < fetchedSuppliers.length - 1 ? prev + 1 : prev)); } 
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedSupplierIndex(prev => (prev > 0 ? prev - 1 : prev)); } 
    else if (e.key === 'Enter') { 
      e.preventDefault(); 
      const selected = fetchedSuppliers[highlightedSupplierIndex]; 
      if (selected) { 
        setSelectedSupplier(selected); setSupplierSearch(''); setIsSupplierFocused(false); 
        setTimeout(() => cantidadInputRef.current?.focus(), 100);
      } 
    }
  };

  // ================= LÓGICA DE GUARDADO =================
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customProductName.trim() || !cantidad.trim()) return;
    
    setIsSubmitting(true);
    
    // Inyectamos el ID si se seleccionó uno.
    const payload = {
      productId: selectedProduct ? selectedProduct.id : null, 
      newProductName: customProductName.trim(),
      supplierId: selectedSupplier?.id || null,
      quantityText: cantidad.trim(),
      notes: mensaje.trim()
    };

    const success = await onSave(payload, isEdit);

    setIsSubmitting(false);
    if (success) onClose();
  };

  const executeStatusChange = async () => {
    if (statusToConfirm !== null && onChangeStatus && initialData) {
      setIsSubmitting(true);
      await onChangeStatus(initialData.id, statusToConfirm);
      setIsSubmitting(false);
      setConfirmModalOpen(false);
      onClose(); 
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[40] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#121212] border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
          
          <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#0a0a0a] rounded-t-3xl shrink-0">
            <h3 className="text-2xl font-black text-white flex items-center tracking-wide">
              {isReadOnly ? (
                <span className="text-gray-400 mr-3 flex items-center gap-2">🔒 Registro Histórico</span>
              ) : (
                <span className={`${isPartialBlock ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-600/20 text-purple-500'} p-2 rounded-xl mr-3`}>✨</span>
              )}
              {isReadOnly ? 'Consulta de Encargo' : isEdit ? 'Editar Encargo Especial' : 'Anotar Encargo Fuera de Catálogo'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-red-500/20 p-2 rounded-xl transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            
            <div className={`relative ${isReadOnly || isPartialBlock ? 'opacity-70 pointer-events-none' : ''}`}>
              <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3">1. Nombre del Artículo Solicitado *</label>
              <input 
                ref={customProductInputRef} type="text" value={customProductName} onChange={(e) => setCustomProductName(e.target.value)} 
                onKeyDown={handleCustomProductKeyDown}
                placeholder="Ej. Llave de paso 3/4 marca Foset..." 
                className="w-full bg-[#121212] border-2 border-gray-800 text-white text-xl rounded-3xl p-4 font-bold outline-none focus:border-purple-500 transition-all" autoComplete="off" 
              />
              {!isEdit && (
                <div className="text-[11px] text-purple-400 mt-2 font-bold flex items-center gap-1">⚠️ Este encargo requerirá ser dado de alta en el catálogo oficial.</div>
              )}
            </div>

            {/* ================= SECCIÓN NUEVA: ENLAZAR A CATÁLOGO ================= */}
            {isEdit && !isReadOnly && (
              <div className={`relative p-5 rounded-3xl border-2 transition-all ${selectedProduct ? 'bg-green-500/10 border-green-500/30' : 'bg-green-500/5 border-dashed border-green-500/30'}`}>
                <label className="block text-sm font-black uppercase tracking-wider mb-2 text-green-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  Enlazar a Producto Oficial
                </label>
                <p className="text-xs text-green-500/70 mb-4 font-bold">¿Ya lo diste de alta en sistema? Búscalo aquí para ligarlo a este registro.</p>

                {!selectedProduct ? (
                  <div className="relative">
                    <input 
                      type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} 
                      onKeyDown={handleProductKeyDown} onFocus={() => setIsProductFocused(true)} onBlur={() => setTimeout(() => setIsProductFocused(false), 200)} 
                      placeholder="🔍 Buscar en el catálogo por nombre o código..." 
                      className="w-full bg-[#121212] border-2 border-green-500/30 text-white text-base rounded-2xl pl-4 pr-10 py-3 outline-none focus:border-green-500 transition-all" autoComplete="off" 
                    />
                    {isProductFocused && productSearch.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-green-500/60 rounded-3xl z-40 max-h-64 overflow-y-auto custom-scrollbar shadow-2xl">
                        {fetchedProducts.map((prod, idx) => (
                          <div key={prod.id} onClick={() => applyProductSelection(prod)} className={`p-4 cursor-pointer flex justify-between ${idx === highlightedProductIndex ? 'bg-gray-800 border-l-4 border-green-500' : 'hover:bg-gray-800/50'}`}>
                            <span className="text-green-500 font-mono mr-2">{prod.internalCode}</span><span className="text-white font-bold">{prod.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-[#121212] p-4 rounded-2xl border border-green-500/20 shadow-inner">
                    <div>
                      <div className="text-green-500 font-mono text-sm">{selectedProduct.internalCode}</div>
                      <div className="text-white font-bold text-lg">{selectedProduct.name}</div>
                    </div>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Quitar enlace</button>
                  </div>
                )}
              </div>
            )}

            <div className={`relative ${isReadOnly || isPartialBlock ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>2. Seleccionar Proveedor (Opcional)</span>
                {selectedSupplier && !isReadOnly && !isPartialBlock && <button type="button" onClick={() => { setSelectedSupplier(null); setTimeout(() => supplierInputRef.current?.focus(), 100); }} className="text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1 rounded-lg hover:bg-blue-500/20">Cambiar proveedor</button>}
              </label>
              {!selectedSupplier ? (
                <div className="relative">
                  <input 
                    ref={supplierInputRef} type="text" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} 
                    onKeyDown={handleSupplierKeyDown} onFocus={() => setIsSupplierFocused(true)} onBlur={() => setTimeout(() => setIsSupplierFocused(false), 200)} 
                    placeholder="🏢 Buscar proveedor..." 
                    className="w-full bg-[#121212] border-2 border-gray-800 text-white text-xl rounded-3xl pl-6 pr-12 py-4 font-bold outline-none focus:border-blue-500 transition-all" autoComplete="off" 
                  />
                  {isSupplierFocused && supplierSearch.length >= 2 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#121212] border-2 border-blue-500/60 rounded-3xl z-40 max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-800 shadow-2xl">
                      {fetchedSuppliers.map((sup, idx) => (
                        <div key={sup.id} onClick={() => { setSelectedSupplier(sup); setSupplierSearch(''); setIsSupplierFocused(false); setTimeout(() => cantidadInputRef.current?.focus(), 100); }} className={`p-4 cursor-pointer flex justify-between ${idx === highlightedSupplierIndex ? 'bg-gray-800 border-l-4 border-blue-500' : 'hover:bg-gray-800/50'}`}>
                           <span className="text-white font-bold">{sup.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-3xl p-5 shadow-inner">
                  <div className="text-white font-bold text-xl">{selectedSupplier.name}</div>
                  <div className="text-blue-400 font-mono text-sm">Contacto: {selectedSupplier.contactName || 'No especificado'}</div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className={`w-full max-w-xs ${isReadOnly || isPartialBlock ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3">3. Cantidad / Unidades *</label>
                <input 
                  ref={cantidadInputRef} type="text" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} 
                  onKeyDown={(e) => { if(e.key === 'Enter') mensajeInputRef.current?.focus(); }}
                  className="w-full bg-[#121212] border-2 border-gray-800 text-white font-black text-xl rounded-3xl py-4 px-6 outline-none focus:border-green-500 text-center" 
                  placeholder="Ej. 1 pieza..." autoComplete="off" 
                />
              </div>
              <div className={`${isReadOnly ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-wider mb-3">4. Notas (Opcional) {isPartialBlock && <span className="text-blue-400 normal-case font-bold ml-2">(Editable)</span>}</label>
                <textarea 
                  ref={mensajeInputRef} value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                  className="w-full bg-[#121212] border-2 border-gray-800 text-white rounded-3xl p-6 outline-none focus:border-gray-400 resize-none h-32 custom-scrollbar text-base" 
                  placeholder="Comentarios, cliente que lo encargó..."
                />
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] rounded-b-3xl flex justify-between items-center shrink-0">
            <div className="flex gap-2">
              {isEdit && currentStatus === 0 && (
                <>
                  <button type="button" onClick={() => { setStatusToConfirm(2); setConfirmModalOpen(true); }} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl font-bold transition-colors">
                    <span>Cancelar</span><kbd className="bg-red-500/20 px-2 py-0.5 rounded text-[10px]">F4</kbd>
                  </button>
                  <button type="button" onClick={() => { setStatusToConfirm(1); setConfirmModalOpen(true); }} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-2xl font-bold transition-colors">
                    <span>Hacer Pedido</span><kbd className="bg-purple-500/20 px-2 py-0.5 rounded text-[10px]">F2</kbd>
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3 ml-auto items-center">
              {isReadOnly ? (
                <button type="button" onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white text-base font-black py-3.5 px-10 rounded-2xl transition-all">Cerrar</button>
              ) : (
                <>
                  <button type="button" onClick={onClose} className="text-gray-400 hover:text-white px-4 py-3.5 font-bold transition-colors">Cancelar</button>
                  
                  {isEdit && selectedProduct ? (
                    <button 
                      onClick={(e) => handleSubmit(e)} 
                      disabled={isSubmitting || !customProductName.trim() || !cantidad.trim()} 
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-base font-black py-3.5 px-8 rounded-2xl transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                      {isSubmitting ? 'Procesando...' : 'Enlazar y Guardar'}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleSubmit(e)} 
                      disabled={isSubmitting || !customProductName.trim() || !cantidad.trim()} 
                      className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-base font-black py-3.5 px-10 rounded-2xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.25)]"
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar Encargo'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal 
        isOpen={confirmModalOpen}
        type={statusToConfirm === 1 ? 'purple' : 'danger'}
        title="¿Confirmar Acción?"
        message={
          <>
            Estás a punto de cambiar el estado de este registro a: <br/>
            <strong className={`block mt-2 text-xl tracking-wider ${statusToConfirm === 1 ? 'text-purple-400' : 'text-red-400'}`}>
              {statusToConfirm === 1 ? 'PEDIDO (Enviado)' : 'CANCELADO'}
            </strong>
          </>
        }
        onConfirm={executeStatusChange}
        onCancel={() => { setConfirmModalOpen(false); setStatusToConfirm(null); }}
      />
    </>
  );
};

export default CustomOrderModal;