// src/components/products/ProductStepPresentations.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CreatePresentationRequest } from '../../types/product';
import { Supplier } from '../../types/supplier';
import CustomDatePicker from '../CustomDatePicker';

interface ProductStepPresentationsProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  suppliers: Supplier[];
  isLoadingSuppliers: boolean;
  presentations: CreatePresentationRequest[];
  setPresentations: React.Dispatch<React.SetStateAction<CreatePresentationRequest[]>>;
  onBackToBase: () => void;
  onFinishToSummary: () => void;
  showNotification: (msg: string) => void;
}

const UNIT_OPTIONS = [
  { value: 'PZA', label: 'PZA (PIEZA)' },
  { value: 'KG', label: 'KG (KILOGRAMO)' },
  { value: 'L', label: 'L (LITRO)' },
  { value: 'JGO', label: 'JGO (JUEGO)' },
  { value: 'PAR', label: 'PAR' }
];

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
    supplierPrice: "",
    stockFactor: 1
  });

  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [hasCustomCode, setHasCustomCode] = useState(false);
  const [hasCustomBarcode, setHasCustomBarcode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const isEditing = !!baseProduct.id;

  // Bloquea la tecla de signo menos (-) y notación científica (e/E) en inputs numéricos
  const preventNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  // --- ESTADOS PARA BUSCADOR RÁPIDO DE PROVEEDOR (POR ID O FLECHAS) ---
  const [supplierQuery, setSupplierQuery] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [activeSupplierIndex, setActiveSupplierIndex] = useState(0);

  useEffect(() => {
    const currentSup = suppliers.find(s => s.id === Number(baseProduct.supplierId));
    if (currentSup && !showSupplierDropdown) {
      setSupplierQuery(`#${currentSup.id} - ${currentSup.name}`);
    }
  }, [baseProduct.supplierId, suppliers, showSupplierDropdown]);

  const filteredSuppliers = suppliers.filter(sup => {
    const q = supplierQuery.trim().toLowerCase().replace(/^#/, '');
    if (!q) return true;
    return (
      sup.id.toString().includes(q) ||
      sup.name.toLowerCase().includes(q) ||
      (sup.contactName && sup.contactName.toLowerCase().includes(q))
    );
  });

  const handleSupplierInputChange = (val: string) => {
    setSupplierQuery(val);
    setShowSupplierDropdown(true);
    setActiveSupplierIndex(0);

    const cleanNum = val.trim().replace(/^#/, '');
    if (/^\d+$/.test(cleanNum)) {
      const exactMatch = suppliers.find(s => s.id === Number(cleanNum));
      if (exactMatch) {
        setBaseProduct((prev: any) => ({ ...prev, supplierId: exactMatch.id }));
      }
    }
  };

  const handleSelectSupplier = (sup: Supplier) => {
    setBaseProduct((prev: any) => ({ ...prev, supplierId: sup.id }));
    setSupplierQuery(`#${sup.id} - ${sup.name}`);
    setShowSupplierDropdown(false);
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSupplierDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowSupplierDropdown(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSupplierIndex(prev => (prev < filteredSuppliers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSupplierIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuppliers[activeSupplierIndex]) {
        handleSelectSupplier(filteredSuppliers[activeSupplierIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSupplierDropdown(false);
    }
  };

  // --- CÁLCULO AUTOMÁTICO BIDIRECCIONAL DE PRECIOS Y GANANCIA (SIN NEGATIVOS) ---
  const handleSalePriceChange = (val: string) => {
    if (val === "") {
      setBaseProduct((prev: any) => ({ ...prev, baseSalePrice: "", profitMargin: "" }));
      return;
    }
    const rawSalePrice = parseFloat(val);
    if (isNaN(rawSalePrice)) return;
    const salePrice = Math.max(0, rawSalePrice);

    setBaseProduct((prev: any) => {
      const cost = parseFloat(prev.supplierPrice);
      let newMargin = prev.profitMargin;
      if (!isNaN(cost) && cost > 0) {
        newMargin = Number((((salePrice / cost) - 1) * 100).toFixed(2));
      }
      return {
        ...prev,
        baseSalePrice: salePrice,
        profitMargin: newMargin
      };
    });
  };

  const handleSupplierPriceChange = (val: string) => {
    if (val === "") {
      setBaseProduct((prev: any) => ({ ...prev, supplierPrice: "" }));
      return;
    }
    const rawCost = parseFloat(val);
    if (isNaN(rawCost)) return;
    const cost = Math.max(0, rawCost);

    setBaseProduct((prev: any) => {
      const salePrice = parseFloat(prev.baseSalePrice);
      const margin = parseFloat(prev.profitMargin);

      if (!isNaN(salePrice) && salePrice > 0 && cost > 0) {
        const newMargin = Number((((salePrice / cost) - 1) * 100).toFixed(2));
        return { ...prev, supplierPrice: cost, profitMargin: newMargin };
      }
      if ((prev.baseSalePrice === "" || salePrice === 0) && !isNaN(margin) && cost > 0) {
        const newSale = Math.max(0, Number((cost * (1 + margin / 100)).toFixed(2)));
        return { ...prev, supplierPrice: cost, baseSalePrice: newSale };
      }

      return { ...prev, supplierPrice: cost };
    });
  };

  const handleProfitMarginChange = (val: string) => {
    if (val === "") {
      setBaseProduct((prev: any) => ({ ...prev, profitMargin: "" }));
      return;
    }
    const rawMargin = parseFloat(val);
    if (isNaN(rawMargin)) return;
    const margin = Math.max(0, rawMargin);

    setBaseProduct((prev: any) => {
      const cost = parseFloat(prev.supplierPrice);
      let newSale = prev.baseSalePrice;
      if (!isNaN(cost) && cost > 0) {
        newSale = Math.max(0, Math.round(cost * (1 + margin / 100)));
      }
      return {
        ...prev,
        profitMargin: margin,
        baseSalePrice: newSale
      };
    });
  };

  const handleNumberChange = (field: string, value: string, isFloat: boolean = false, isBase: boolean = false) => {
    const targetSet = isBase ? setBaseProduct : setCurrentPres;
    if (value === "") {
      targetSet((prev: any) => ({ ...prev, [field]: "" }));
    } else {
      const rawNum = isFloat ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(rawNum)) {
        const safeNum = Math.max(0, rawNum);
        targetSet((prev: any) => ({ ...prev, [field]: safeNum }));
      }
    }
  };

  // --- CONVERSIÓN DE FECHA PARA CUSTOMDATEPICKER ---
  const parseStringToDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const handleCustomDateSelect = (date: Date | null) => {
    if (!date) {
      setBaseProduct((prev: any) => ({ ...prev, nextExpirationDate: '' }));
      return;
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setBaseProduct((prev: any) => ({ ...prev, nextExpirationDate: `${yyyy}-${mm}-${dd}` }));
  };

  const handleSavePresentation = (e: React.MouseEvent) => {
    e.preventDefault();
    const finalCode = hasCustomCode && currentPres.code.trim() !== '' ? currentPres.code.trim() : baseProduct.internalCode;
    const finalBarcode = hasCustomBarcode && currentPres.barcode.trim() !== '' ? currentPres.barcode.trim() : baseProduct.barcode;

    if (!currentPres.name.trim() || !finalCode || Number(currentPres.price) <= 0) {
      showNotification("Llena el Nombre, asegúrate de tener un Código y un Precio mayor a 0.");
      return;
    }

    if (currentPres.supplierPrice === "" || Number(currentPres.supplierPrice) < 0) {
      showNotification("El Costo de Proveedor de esta variante no puede estar vacío ni ser negativo.");
      return;
    }

    const updatedPres = { 
      ...currentPres, 
      code: finalCode,
      barcode: finalBarcode || "",
      price: Math.max(0, Number(currentPres.price)),
      supplierPrice: Math.max(0, Number(currentPres.supplierPrice)),
      stockFactor: Math.max(0.0001, Number(currentPres.stockFactor || 1))
    };

    if (editingIndex !== null) {
      const newList = [...presentations];
      newList[editingIndex] = updatedPres;
      setPresentations(newList);
      setEditingIndex(null);
    } else {
      setPresentations([...presentations, updatedPres]);
    }

    setCurrentPres({ name: '', code: '', barcode: '', price: "", supplierPrice: "", stockFactor: 1 });
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
    const item = presentations[idx];
    const yaExisteEnBD = !!item.id && Number(item.id) > 0;

    if (yaExisteEnBD) {
      const confirmado = window.confirm(
        `"${item.name}" ya existe en el catálogo. Al quitarla y guardar, esta presentación se DESACTIVARÁ (no se borra, pero dejará de venderse). ¿Continuar?`
      );
      if (!confirmado) return;
    }

    setPresentations(presentations.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
      setCurrentPres({ name: '', code: '', barcode: '', price: "", supplierPrice: "", stockFactor: 1 });
      setHasCustomCode(false);
      setHasCustomBarcode(false);
      setIsVariantFormOpen(false);
    }
    showNotification(yaExisteEnBD ? "Se desactivará al guardar los cambios." : "Variante eliminada de la lista.");
  };

  // VALIDACIÓN OBLIGATORIA PARA AVANZAR AL RESUMEN FINAL
  const validateAndFinish = useCallback(() => {
    if (!baseProduct.unitOfMeasure || !baseProduct.supplierId || Number(baseProduct.supplierId) === 0) {
      showNotification("La Unidad de Medida y el Proveedor son obligatorios.");
      return;
    }
    if (baseProduct.supplierPrice === "" || Number(baseProduct.supplierPrice) < 0) {
      showNotification("El Precio de Proveedor no puede estar vacío ni ser negativo.");
      return;
    }
    if (presentations.length === 0 && (!baseProduct.baseSalePrice || Number(baseProduct.baseSalePrice) <= 0)) {
      showNotification("Debes especificar un 'Precio Venta al Público ($)' mayor a 0.");
      return;
    }
    if (baseProduct.hasExpiration && (!baseProduct.nextExpirationDate || baseProduct.nextExpirationDate.length !== 10)) {
      showNotification("Activaste 'Tiene Caducidad', por favor selecciona la Fecha de Vencimiento.");
      return;
    }
    onFinishToSummary();
  }, [baseProduct, presentations.length, onFinishToSummary, showNotification]);

  const handleFinish = (e: React.MouseEvent) => {
    e.preventDefault();
    validateAndFinish();
  };

  // ATAJO DE TECLADO: Alt + S o Ctrl + Enter para Ver Resumen Final
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isAltS = e.altKey && e.key.toLowerCase() === 's';
      const isCtrlEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';

      if (isAltS || isCtrlEnter) {
        e.preventDefault();
        validateAndFinish();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [validateAndFinish]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-16">
      
      {/* COLUMNA IZQUIERDA: FORMULARIOS */}
      <div className="flex-1 space-y-8">
        
        {/* SECCIÓN 1: PROVEEDOR, UNIDAD BASE, FACTOR Y PRECIOS AUTOMÁTICOS */}
        <div id="seccion-base" className="p-6 bg-[#121212] rounded-2xl border border-gray-800 space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-3">
            1. Costos, Unidad Base y Precio de Venta (Padre)
          </h3>
          
          {/* FILA SUPERIOR: PROVEEDOR + SELECT DE UNIDAD DE MEDIDA + FACTOR BASE */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* SELECTOR DE PROVEEDOR RÁPIDO */}
            <div className="md:col-span-2 relative">
              <label className="block text-brand-orange font-bold mb-2">
                Proveedor Principal (Escribe ID o Nombre) *
              </label>
              {isLoadingSuppliers ? (
                <p className="text-gray-500 py-3">Cargando proveedores...</p>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. 1, Truper, IUSA..."
                    value={supplierQuery}
                    onFocus={() => {
                      setSupplierQuery('');
                      setShowSupplierDropdown(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSupplierDropdown(false);
                        const currentSup = suppliers.find(s => s.id === Number(baseProduct.supplierId));
                        if (currentSup) {
                          setSupplierQuery(`#${currentSup.id} - ${currentSup.name}`);
                        }
                      }, 200);
                    }}
                    onChange={e => handleSupplierInputChange(e.target.value)}
                    onKeyDown={handleSupplierKeyDown}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl pl-4 pr-10 py-3 focus:border-brand-orange focus:outline-none font-bold"
                  />
                  <span className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">▼</span>

                  {showSupplierDropdown && (
                    <ul className="absolute z-50 w-full bg-[#1a1a1a] border border-gray-700 mt-1 rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
                      {filteredSuppliers.length === 0 ? (
                        <li className="px-4 py-3 text-gray-500 text-sm">No se encontraron proveedores</li>
                      ) : (
                        filteredSuppliers.map((sup, idx) => (
                          <li
                            key={sup.id}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSelectSupplier(sup)}
                            className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm font-bold transition-colors border-b border-gray-800/60 last:border-0 ${
                              idx === activeSupplierIndex
                                ? 'bg-brand-orange text-black'
                                : 'text-white hover:bg-brand-orange/20'
                            }`}
                          >
                            <span>
                              <span className={`font-mono mr-2 px-1.5 py-0.5 rounded text-xs ${idx === activeSupplierIndex ? 'bg-black/20 text-black' : 'bg-black/50 text-brand-orange'}`}>
                                ID: {sup.id}
                              </span>
                              {sup.name}
                            </span>
                            {sup.contactName && (
                              <span className={`text-xs ${idx === activeSupplierIndex ? 'text-black/80' : 'text-gray-400'}`}>
                                ({sup.contactName})
                              </span>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* UNIDAD DE MEDIDA (LISTA DESPLEGABLE) */}
            <div>
              <label className="block text-gray-300 font-bold mb-2">Unidad de Medida *</label>
              <select
                style={{ colorScheme: 'dark' }}
                value={baseProduct.unitOfMeasure || 'PZA'}
                onChange={e => setBaseProduct({ ...baseProduct, unitOfMeasure: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-bold"
              >
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white py-2">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* FACTOR DE STOCK (FUERA DEL CUADRO DE STOCK) */}
            <div>
              <label className="block text-gray-300 font-bold mb-2">Factor de Stock</label>
              <input 
                type="number" 
                min="0"
                step="any" 
                onKeyDown={preventNegativeKey}
                value={baseProduct.baseStockFactor === "" ? "" : baseProduct.baseStockFactor}
                onChange={e => handleNumberChange("baseStockFactor", e.target.value, true, true)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-brand-orange text-base rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* FILA INFERIOR: 1. PRECIO PÚBLICO, 2. PRECIO PROVEEDOR, 3. GANANCIA % */}
          <div className="pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* 1. PRECIO VENTA AL PÚBLICO */}
            <div>
              <label className="block text-brand-orange font-extrabold text-sm mb-2 uppercase tracking-wide">
                1. Precio Venta al Público ($) *
              </label>
              <input 
                type="number" 
                min="0"
                step="any" 
                placeholder="0.00"
                onKeyDown={preventNegativeKey}
                value={baseProduct.baseSalePrice === "" ? "" : baseProduct.baseSalePrice}
                onChange={e => handleSalePriceChange(e.target.value)}
                className="w-full bg-[#0a0a0a] border-2 border-brand-orange text-brand-orange text-2xl rounded-xl px-4 py-3 focus:outline-none font-mono font-black shadow-[0_0_15px_rgba(255,90,0,0.15)]"
              />
            </div>

            {/* 2. PRECIO PROVEEDOR */}
            <div>
              <label className="block text-gray-300 font-bold text-sm mb-2 uppercase tracking-wide">
                2. Precio Proveedor ($) *
              </label>
              <input 
                type="number" 
                min="0"
                step="any" 
                placeholder="Costo de compra"
                onKeyDown={preventNegativeKey}
                value={baseProduct.supplierPrice === "" ? "" : baseProduct.supplierPrice}
                onChange={e => handleSupplierPriceChange(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-xl rounded-xl px-4 py-3.5 focus:border-brand-orange focus:outline-none font-mono font-bold"
              />
            </div>

            {/* 3. GANANCIA (%) AUTOMÁTICA */}
            <div>
              <label className="block text-gray-300 font-bold text-sm mb-2 uppercase tracking-wide">
                3. Ganancia (%)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  step="any" 
                  placeholder="Ej. 30"
                  onKeyDown={preventNegativeKey}
                  value={baseProduct.profitMargin === "" ? "" : baseProduct.profitMargin}
                  onChange={e => handleProfitMarginChange(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-green-400 text-xl rounded-xl pl-4 pr-10 py-3.5 focus:border-brand-orange focus:outline-none font-mono font-bold"
                />
                <span className="absolute right-4 top-4 text-gray-400 font-bold font-mono">%</span>
              </div>
            </div>

          </div>
          <p className="text-xs text-gray-500">
            ⚡ Cálculo automático activo: Escribe el costo de proveedor y el precio público (o el porcentaje de ganancia) y el otro campo se calculará al instante.
          </p>
        </div>

        {/* SECCIÓN 2: SELECTORES APILADOS UNO ENCIMA DEL OTRO (ACORDEÓN EXPANDIBLE) */}
        <div className="space-y-4">
          
          {/* SELECTOR 1: CONTROL DE STOCK */}
          <div className={`p-5 bg-[#121212] rounded-2xl border transition-all duration-200 ${baseProduct.isInventoryTracked ? 'border-brand-orange/60 shadow-lg' : 'border-gray-800'}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setBaseProduct({...baseProduct, isInventoryTracked: !baseProduct.isInventoryTracked})}
            >
              <div>
                <h4 className="text-white font-bold text-lg">¿Control de Stock?</h4>
                <p className="text-xs text-gray-400">
                  {baseProduct.isInventoryTracked ? 'Habilitado: Se llevará conteo de existencias en almacén.' : 'Apagado (N/S): No se descontará inventario al vender.'}
                </p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.isInventoryTracked ? 'bg-brand-orange' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.isInventoryTracked ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            {baseProduct.isInventoryTracked && (
              <div className="mt-4 pt-4 border-t border-gray-800 animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-64">
                  <label className="block text-xs text-gray-400 font-bold mb-1.5 uppercase">
                    {isEditing ? 'Stock Actual en Sistema' : 'Stock Inicial de Apertura'}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="any" 
                    placeholder="Ej. 50"
                    disabled={isEditing}
                    onKeyDown={preventNegativeKey}
                    value={baseProduct.initialStock === "" ? "" : baseProduct.initialStock}
                    onChange={e => {
                      if (!isEditing) {
                        handleNumberChange("initialStock", e.target.value, true, true);
                      }
                    }}
                    className={`w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-xl px-4 py-2.5 font-mono font-bold text-base focus:border-brand-orange focus:outline-none ${isEditing ? 'opacity-40 cursor-not-allowed bg-black/50' : ''}`}
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-500 italic mt-4">
                    * El inventario actual sólo se modifica desde el módulo de Entradas / Salidas.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SELECTOR 2: TIENE CADUCIDAD (CON CUSTOMDATEPICKER) */}
          <div className={`p-5 bg-[#121212] rounded-2xl border transition-all duration-200 ${baseProduct.hasExpiration ? 'border-brand-orange/60 shadow-lg' : 'border-gray-800'}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setBaseProduct({...baseProduct, hasExpiration: !baseProduct.hasExpiration})}
            >
              <div>
                <h4 className="text-white font-bold text-lg">¿Tiene Caducidad?</h4>
                <p className="text-xs text-gray-400">Para productos perecederos como pinturas, solventes, pegamentos o cementos.</p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.hasExpiration ? 'bg-brand-orange' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.hasExpiration ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            {baseProduct.hasExpiration && (
              <div className="mt-4 pt-4 border-t border-gray-800 animate-in slide-in-from-top-2 fade-in duration-200 flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <CustomDatePicker
                    label="Fecha de Vencimiento *"
                    selected={parseStringToDate(baseProduct.nextExpirationDate)}
                    onChange={handleCustomDateSelect}
                    placeholder="DD/MM/AAAA"
                  />
                </div>
                {baseProduct.nextExpirationDate && (
                  <div className="sm:mt-5 text-xs font-mono text-brand-orange bg-brand-orange/10 border border-brand-orange/30 px-3 py-2 rounded-lg">
                    Formato BD: <strong>{baseProduct.nextExpirationDate}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SELECTOR 3: PERMITE FRACCIONES */}
          <div className={`p-5 bg-[#121212] rounded-2xl border transition-all duration-200 ${baseProduct.allowFractions ? 'border-brand-orange/60 shadow-lg' : 'border-gray-800'}`}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setBaseProduct({...baseProduct, allowFractions: !baseProduct.allowFractions})}
            >
              <div>
                <h4 className="text-white font-bold text-lg">¿Es Fraccionable? (Permite decimales)</h4>
                <p className="text-xs text-gray-400">Habilita ventas con punto decimal en mostrador (ej. 0.5 metros, 1.25 kg).</p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.allowFractions ? 'bg-brand-orange' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.allowFractions ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            {baseProduct.allowFractions && (
              <div className="mt-4 pt-4 border-t border-gray-800 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-brand-orange/10 p-3 rounded-xl border border-brand-orange/30">
                  <p className="text-xs text-brand-orange font-bold leading-snug">
                    ⚡ Venta fraccionada activa: El cajero podrá ingresar cantidades decimales como 0.5, 0.25 o 1.50 al vender este artículo.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* SECCIÓN 3: CAPTURA DE VARIANTES (HIJOS) */}
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
              onClick={() => {
                setEditingIndex(null);
                setCurrentPres({ name: '', code: '', barcode: '', price: "", supplierPrice: "", stockFactor: 1 });
                setIsVariantFormOpen(true);
              }}
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
                 <button type="button" onClick={() => { setIsVariantFormOpen(false); setEditingIndex(null); }} className="text-gray-500 hover:text-white font-bold text-sm">✕ Cerrar</button>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-brand-orange font-bold mb-2">Precio de Venta ($) *</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any" 
                    onKeyDown={preventNegativeKey}
                    value={currentPres.price} 
                    onChange={e => handleNumberChange("price", e.target.value, true)} 
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-2xl font-black rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono text-brand-orange" 
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-2">Costo Proveedor ($) *</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01" 
                    onKeyDown={preventNegativeKey}
                    placeholder="Costo de compra de esta variante" 
                    value={currentPres.supplierPrice} 
                    onChange={e => handleNumberChange("supplierPrice", e.target.value, true)} 
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-2">Factor de Stock (Padre = 1)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any" 
                    onKeyDown={preventNegativeKey}
                    value={currentPres.stockFactor === "" ? "" : currentPres.stockFactor} 
                    onChange={e => handleNumberChange("stockFactor", e.target.value, true)} 
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold" 
                  />
                </div>
              </div>

              {Number(currentPres.price) > 0 && currentPres.supplierPrice !== "" && (
                (() => {
                  const precio = Number(currentPres.price);
                  const costo = Number(currentPres.supplierPrice);
                  const margen = ((precio - costo) / precio) * 100;
                  const esRiesgoso = margen < 15;
                  return (
                    <div className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-between ${esRiesgoso ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                      <span>{esRiesgoso ? '⚠️ Margen bajo o negativo' : '✓ Margen saludable'}</span>
                      <span>{margen.toFixed(1)}%</span>
                    </div>
                  );
                })()
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
                {editingIndex !== null ? (
                  <button 
                    type="button" 
                    onClick={() => handleDeletePresentation(editingIndex)} 
                    className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold transition-all border border-red-500/30 flex items-center shadow-md"
                  >
                    🗑️ Eliminar esta Variante
                  </button>
                ) : <div />}
                
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
          <button 
            type="button" 
            onClick={handleFinish} 
            title="Atajo de teclado: Alt + S o Ctrl + Enter"
            className="px-8 py-3.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-black font-extrabold transition-colors shadow-lg flex items-center gap-3"
          >
            <span>Ver Resumen Final →</span>
            <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded">
              Alt + S
            </span>
          </button>
        </div>

      </div>

      {/* COLUMNA DERECHA: SIDEBAR DE CARDS ESTÁTICOS */}
      <div className="w-full xl:w-80 flex-shrink-0">
        <div className="sticky top-0 space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-4">Resumen de Ventas</h3>
          
          <div 
            onClick={() => scrollToSection('seccion-base')} 
            className="cursor-pointer p-4 bg-brand-orange/10 border border-brand-orange/40 rounded-2xl hover:bg-brand-orange/20 transition-all shadow-md group relative"
          >
            <div className="flex justify-between items-start mb-1">
               <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest bg-brand-orange/20 px-2 py-0.5 rounded">1. Principal (Base)</p>
               <span className="text-[10px] text-brand-orange/80 font-semibold bg-black/40 px-2 py-0.5 rounded">Inamovible</span>
            </div>
            <p className="font-extrabold text-white text-lg truncate mt-2">{baseProduct.name || 'Sin Nombre'}</p>
            <div className="flex justify-between items-end mt-3">
              <p className="text-3xl font-black font-mono text-brand-orange">${baseProduct.baseSalePrice || '0'}</p>
              <p className="text-xs text-brand-orange/80 font-bold bg-black/40 px-2 py-1 rounded">Factor: x{baseProduct.baseStockFactor || '1'}</p>
            </div>
          </div>

          {presentations.map((p, idx) => {
            const margen = p.supplierPrice > 0 && p.price > 0 
              ? (((p.price - p.supplierPrice) / p.price) * 100).toFixed(0) 
              : null;
            return (
              <div 
                key={idx} 
                onClick={() => { scrollToSection('seccion-variantes'); handleEditPresentation(idx); }} 
                className="cursor-pointer p-4 bg-[#121212] border border-gray-700 rounded-2xl hover:border-gray-500 transition-all shadow-sm group relative"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{idx + 2}. Variante</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✎ Editar</span>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeletePresentation(idx); }}
                      className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                      title="Eliminar esta presentación"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="font-extrabold text-white text-md truncate mt-1">{p.name}</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-xl font-black font-mono text-white">${p.price}</p>
                  <p className="text-xs text-gray-400 font-bold bg-black/40 px-2 py-1 rounded">Factor: x{p.stockFactor}</p>
                </div>
                {margen !== null && (
                  <p className={`text-[10px] font-bold mt-1 ${Number(margen) < 15 ? 'text-red-400' : 'text-green-400'}`}>
                    Margen: {margen}%
                  </p>
                )}
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
};

export default ProductStepPresentations;