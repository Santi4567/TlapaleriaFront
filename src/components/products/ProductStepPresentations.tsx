// src/components/products/ProductStepPresentations.tsx
import React, { useState } from 'react';
import { CreatePresentationRequest } from '../../types/product';
import { Supplier } from '../../types/supplier';

interface ProductStepPresentationsProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  suppliers: Supplier[];
  isLoadingSuppliers: boolean;
  presentations: CreatePresentationRequest[];
  setPresentations: React.Dispatch<React.SetStateAction<CreatePresentationRequest[]>>;
  onBackToBase: () => void;
  onFinishToSummary: () => void;
  showNotification: (msg: string) => void; // NUEVO: Prop para la notificación
}

const ProductStepPresentations: React.FC<ProductStepPresentationsProps> = ({
  baseProduct,
  setBaseProduct,
  suppliers,
  isLoadingSuppliers,
  presentations,
  setPresentations,
  onBackToBase,
  onFinishToSummary,
  showNotification
}) => {
  const [currentPres, setCurrentPres] = useState<any>({
    name: '',
    code: '',
    barcode: '',
    price: "",
    stockFactor: 1
  });

  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [hasCustomCode, setHasCustomCode] = useState(false);
  const [hasCustomBarcode, setHasCustomBarcode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleNumberChange = (field: string, value: string, isFloat: boolean = false, isBase: boolean = false) => {
    const targetSet = isBase ? setBaseProduct : setCurrentPres;
    if (value === "") {
      targetSet((prev: any) => ({ ...prev, [field]: "" }));
    } else {
      const num = isFloat ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(num)) {
        targetSet((prev: any) => ({ ...prev, [field]: num }));
      }
    }
  };

  // NUEVO: Máscara para la fecha (AAAA-MM-DD) para evitar el bug del calendario GTK
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Solo números
    if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
    if (val.length > 7) val = val.slice(0, 7) + '-' + val.slice(7);
    if (val.length > 10) val = val.slice(0, 10);
    setBaseProduct((prev: any) => ({ ...prev, nextExpirationDate: val }));
  };

  const handleCalculatePrice = () => {
    const costo = Number(baseProduct.supplierPrice || 0);
    const margen = Number(baseProduct.profitMargin || 0);
    if (costo <= 0) {
      showNotification("Por favor ingresa primero un Precio de Compra mayor a 0 para calcular.");
      return;
    }
    const calculado = costo * (1 + (margen / 100));
    setBaseProduct((prev: any) => ({ ...prev, baseSalePrice: Math.round(calculado) }));
  };

  const handleSavePresentation = (e: React.MouseEvent) => {
    e.preventDefault();
    const finalCode = hasCustomCode && currentPres.code.trim() !== '' ? currentPres.code.trim() : baseProduct.internalCode;
    const finalBarcode = hasCustomBarcode && currentPres.barcode.trim() !== '' ? currentPres.barcode.trim() : baseProduct.barcode;

    if (!currentPres.name.trim() || !finalCode || Number(currentPres.price) <= 0) {
      showNotification("Llena el Nombre, asegúrate de tener un Código y un Precio mayor a 0.");
      return;
    }

    const updatedPres = { 
      ...currentPres, 
      code: finalCode,
      barcode: finalBarcode || "",
      price: Number(currentPres.price),
      stockFactor: Number(currentPres.stockFactor || 1)
    };

    if (editingIndex !== null) {
      const newList = [...presentations];
      newList[editingIndex] = updatedPres;
      setPresentations(newList);
      setEditingIndex(null);
    } else {
      setPresentations([...presentations, updatedPres]);
    }

    setCurrentPres({ name: '', code: '', barcode: '', price: "", stockFactor: 1 });
    setHasCustomCode(false);
    setHasCustomBarcode(false);
    setIsVariantFormOpen(false); 
  };

  const handleEditPresentation = (idx: number) => {
    const item = presentations[idx];
    setCurrentPres(item);
    setEditingIndex(idx);
    setHasCustomCode(item.code !== baseProduct.internalCode);
    setHasCustomBarcode(item.barcode !== baseProduct.barcode && item.barcode !== "");
    setIsVariantFormOpen(true); 
  };

  const handleDeletePresentation = (idx: number) => {
    setPresentations(presentations.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
      setCurrentPres({ name: '', code: '', barcode: '', price: "", stockFactor: 1 });
      setHasCustomCode(false);
      setHasCustomBarcode(false);
      setIsVariantFormOpen(false);
    }
  };

  const handleFinish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!baseProduct.unitOfMeasure || baseProduct.supplierId === 0) {
      showNotification("La Unidad Base y el Proveedor son obligatorios.");
      return;
    }
    if (baseProduct.supplierPrice === "" || Number(baseProduct.supplierPrice) < 0) {
      showNotification("El Precio de Compra no puede estar vacío ni ser negativo.");
      return;
    }
    if (presentations.length === 0 && (!baseProduct.baseSalePrice || Number(baseProduct.baseSalePrice) <= 0)) {
      showNotification("Al no agregar variantes, debes especificar el 'Precio Venta al Público ($)'.");
      return;
    }
    onFinishToSummary();
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-16">
      
      {/* COLUMNA IZQUIERDA: FORMULARIOS (flex-1) */}
      <div className="flex-1 space-y-10">
        
        {/* SECCIÓN 1: COSTOS Y PRECIO BASE */}
        <div id="seccion-base" className="p-6 bg-[#121212] rounded-2xl border border-gray-800 space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-3">
            1. Costos y Precio de Venta (Padre)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-brand-orange font-bold mb-2">Proveedor Principal *</label>
              {isLoadingSuppliers ? (
                <p className="text-gray-500 py-3">Cargando...</p>
              ) : (
                <select 
                  style={{ colorScheme: 'dark' }}
                  value={baseProduct.supplierId}
                  onChange={e => setBaseProduct({...baseProduct, supplierId: Number(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-bold"
                >
                  <option value={0}>Selecciona uno...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id} className="bg-[#1a1a1a] text-white py-2">
                      {sup.name} ({sup.contactName})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-gray-300 font-bold mb-2">Precio de Compra ($) *</label>
              <input 
                type="number" step="0.01" placeholder="Costo al mayorista"
                value={baseProduct.supplierPrice === "" ? "" : baseProduct.supplierPrice}
                onChange={e => handleNumberChange("supplierPrice", e.target.value, true, true)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-bold mb-2">Margen Sugerido (%)</label>
              <div className="flex space-x-2">
                <input 
                  type="number" step="1" placeholder="Ej. 30"
                  value={baseProduct.profitMargin === "" ? "" : baseProduct.profitMargin}
                  onChange={e => handleNumberChange("profitMargin", e.target.value, false, true)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
                />
                <button
                  type="button" onClick={handleCalculatePrice} title="Calcular Precio"
                  className="px-4 py-3 bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-black rounded-xl border border-brand-orange/50 transition-all"
                >
                  ⚡
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <label className="block text-brand-orange font-extrabold text-lg mb-2 text-center">
              PRECIO VENTA AL PÚBLICO ($) *
            </label>
            <input 
              type="number" step="1" placeholder="0.00"
              value={baseProduct.baseSalePrice === "" ? "" : baseProduct.baseSalePrice}
              onChange={e => handleNumberChange("baseSalePrice", e.target.value, true, true)}
              className="w-full max-w-sm mx-auto block bg-[#0a0a0a] border-2 border-brand-orange text-brand-orange text-4xl rounded-2xl px-6 py-5 focus:outline-none font-mono font-black text-center shadow-[0_0_15px_rgba(255,90,0,0.2)]"
            />
            <p className="text-center text-sm text-gray-500 mt-2">Precio de salida para la presentación principal en mostrador.</p>
          </div>
        </div>

        {/* SECCIÓN 2: INVENTARIO, FACTOR PADRE Y CADUCIDAD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-[#121212] rounded-2xl border border-gray-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-bold text-lg">¿Control de Stock?</h4>
                <p className="text-xs text-gray-400">Si se apaga, será N/S</p>
              </div>
              <button
                type="button"
                onClick={() => setBaseProduct({...baseProduct, isInventoryTracked: !baseProduct.isInventoryTracked})}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.isInventoryTracked ? 'bg-brand-orange' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.isInventoryTracked ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex space-x-3">
              <div className="w-1/3">
                <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Unidad Base</label>
                <input 
                  type="text" placeholder="KG, PZA..." value={baseProduct.unitOfMeasure}
                  onChange={e => setBaseProduct({...baseProduct, unitOfMeasure: e.target.value.toUpperCase()})}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-2 py-2 font-bold uppercase text-sm"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase">Stock Inicial</label>
                <input 
                  type="number" step="any" disabled={!baseProduct.isInventoryTracked}
                  value={baseProduct.initialStock === "" ? "" : baseProduct.initialStock}
                  onChange={e => handleNumberChange("initialStock", e.target.value, true, true)}
                  className={`w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-2 py-2 font-mono font-bold text-sm ${!baseProduct.isInventoryTracked ? 'opacity-30 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="w-1/3">
                <label className="block text-[10px] text-brand-orange font-bold mb-1 uppercase">Factor Padre</label>
                <input 
                  type="number" step="any" 
                  value={baseProduct.baseStockFactor === "" ? "" : baseProduct.baseStockFactor}
                  onChange={e => handleNumberChange("baseStockFactor", e.target.value, true, true)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-brand-orange rounded-lg px-2 py-2 font-mono font-bold text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#121212] rounded-2xl border border-gray-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-bold text-lg">¿Tiene Caducidad?</h4>
                <p className="text-xs text-gray-400">Pinturas o cementos</p>
              </div>
              <button
                type="button"
                onClick={() => setBaseProduct({...baseProduct, hasExpiration: !baseProduct.hasExpiration})}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.hasExpiration ? 'bg-brand-orange' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.hasExpiration ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* AQUÍ ESTÁ LA MAGIA: INPUT TIPO TEXT CON MÁSCARA AUTOMÁTICA */}
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-1">Fecha de Vencimiento</label>
              <input 
                type="text" 
                placeholder="AAAA-MM-DD"
                disabled={!baseProduct.hasExpiration}
                value={baseProduct.nextExpirationDate}
                onChange={handleDateChange}
                maxLength={10}
                className={`w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 font-mono tracking-widest ${!baseProduct.hasExpiration ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
              <p className="text-[10px] text-gray-500 mt-1">Formato: Año-Mes-Día (Ej. 2027-12-31)</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: CAPTURA DE VARIANTES (HIJOS) OCULTA / EXPANDIBLE */}
        <div id="seccion-variantes" className="p-6 bg-[#121212] rounded-2xl border border-gray-800 space-y-6">
          <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">2. Variantes / Formas de Venta (Hijos)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Si se vende por Kilo, Litro, Metro o Medio Bulto, agrégalo aquí.</p>
            </div>
          </div>

          {!isVariantFormOpen ? (
            <button 
              type="button" 
              onClick={() => setIsVariantFormOpen(true)}
              className="w-full py-6 border-2 border-dashed border-gray-700 hover:border-brand-orange text-gray-400 hover:text-brand-orange font-bold rounded-2xl transition-all flex items-center justify-center text-lg"
            >
              + Agregar Nueva Presentación / Variante
            </button>
          ) : (
            <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-6">
              
              <div className="flex justify-between items-center mb-2">
                 <span className="bg-brand-orange/20 text-brand-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   {editingIndex !== null ? 'Editando Variante' : 'Creando Nueva Variante'}
                 </span>
                 <button onClick={() => { setIsVariantFormOpen(false); setEditingIndex(null); }} className="text-gray-500 hover:text-white font-bold text-sm">✕ Cerrar</button>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-2">Nombre Empaque/Unidad *</label>
                <input 
                  type="text" autoFocus placeholder="Ej. Venta por Metro, Kilo Suelto" value={currentPres.name}
                  onChange={e => setCurrentPres({...currentPres, name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-300">¿Tiene Código de Variante propio?</span>
                    <button type="button" onClick={() => setHasCustomCode(!hasCustomCode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCustomCode ? 'bg-brand-orange' : 'bg-gray-700'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${hasCustomCode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {hasCustomCode ? (
                    <input type="text" placeholder="Ej. CAB-ROL" value={currentPres.code} onChange={e => setCurrentPres({...currentPres, code: e.target.value})} className="w-full bg-[#1a1a1a] border border-brand-orange/50 text-white text-sm rounded-lg px-3 py-2 font-mono focus:outline-none" />
                  ) : (
                    <p className="text-xs text-gray-500 italic font-mono py-2">Código base: <strong className="text-gray-300">{baseProduct.internalCode || 'Sin SKU'}</strong></p>
                  )}
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-300">¿Tiene Barcode propio?</span>
                    <button type="button" onClick={() => setHasCustomBarcode(!hasCustomBarcode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCustomBarcode ? 'bg-brand-orange' : 'bg-gray-700'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${hasCustomBarcode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {hasCustomBarcode ? (
                    <input type="text" placeholder="Ej. 75010000002-B" value={currentPres.barcode} onChange={e => setCurrentPres({...currentPres, barcode: e.target.value})} className="w-full bg-[#1a1a1a] border border-brand-orange/50 text-white text-sm rounded-lg px-3 py-2 font-mono focus:outline-none" />
                  ) : (
                    <p className="text-xs text-gray-500 italic font-mono py-2">Barcode base: <strong className="text-gray-300">{baseProduct.barcode || 'Sin barcode'}</strong></p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-brand-orange font-bold mb-2">Precio de Venta ($) *</label>
                  <input type="number" step="1" value={currentPres.price} onChange={e => handleNumberChange("price", e.target.value, true)} className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-2xl font-black rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono text-brand-orange" />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-2">Factor de Stock (Padre = 1)</label>
                  <input type="number" step="any" value={currentPres.stockFactor === "" ? "" : currentPres.stockFactor} onChange={e => handleNumberChange("stockFactor", e.target.value, true)} className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="button" onClick={handleSavePresentation} className="px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-brand-orange font-extrabold text-lg transition-colors border border-gray-700 shadow-md">
                  {editingIndex !== null ? '✓ Guardar Cambios en Variante' : '+ Guardar Variante en Lista'}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* BOTONES DE NAVEGACIÓN FINALES */}
        <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
          <button type="button" onClick={onBackToBase} className="px-6 py-4 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors">
            ← Regresar (Identificación)
          </button>
          <button type="button" onClick={handleFinish} className="px-8 py-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-black font-extrabold transition-colors shadow-lg">
            Ver Resumen Final →
          </button>
        </div>

      </div>

      {/* COLUMNA DERECHA: SIDEBAR DE CARDS ESTÁTICOS */}
      <div className="w-full xl:w-80 flex-shrink-0">
        <div className="sticky top-0 space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-4">Resumen de Ventas</h3>
          
          <div 
            onClick={() => scrollToSection('seccion-base')} 
            className="cursor-pointer p-4 bg-brand-orange/10 border border-brand-orange/40 rounded-2xl hover:bg-brand-orange/20 transition-all shadow-md group"
          >
            <div className="flex justify-between items-start mb-1">
               <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest bg-brand-orange/20 px-2 py-0.5 rounded">1. Principal (Base)</p>
               <span className="text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
            </div>
            <p className="font-extrabold text-white text-lg truncate mt-2">{baseProduct.name || 'Sin Nombre'}</p>
            <div className="flex justify-between items-end mt-3">
              <p className="text-3xl font-black font-mono text-brand-orange">${baseProduct.baseSalePrice || '0'}</p>
              <p className="text-xs text-brand-orange/80 font-bold bg-black/40 px-2 py-1 rounded">Factor: x{baseProduct.baseStockFactor || '1'}</p>
            </div>
          </div>

          {presentations.map((p, idx) => (
            <div 
              key={idx} 
              onClick={() => { scrollToSection('seccion-variantes'); handleEditPresentation(idx); }} 
              className="cursor-pointer p-4 bg-[#121212] border border-gray-700 rounded-2xl hover:border-gray-500 transition-all shadow-sm group"
            >
               <div className="flex justify-between items-start mb-1">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{idx + 2}. Variante</p>
                 <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
               </div>
               <p className="font-extrabold text-white text-md truncate mt-1">{p.name}</p>
               <div className="flex justify-between items-end mt-2">
                 <p className="text-xl font-black font-mono text-white">${p.price}</p>
                 <p className="text-xs text-gray-400 font-bold bg-black/40 px-2 py-1 rounded">Factor: x{p.stockFactor}</p>
               </div>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};

export default ProductStepPresentations;