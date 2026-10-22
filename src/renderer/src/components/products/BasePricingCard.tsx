// src/components/products/BasePricingCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Supplier } from '../../types/supplier';

interface BasePricingCardProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  suppliers?: Supplier[];
  isLoadingSuppliers: boolean;
  onBaseFactorChange?: (newFactor: number | string) => void;
  hasVariants?: boolean;
}

const UNIT_OPTIONS = [
  { value: 'PZA', label: 'PZA (PIEZA)' },
  { value: 'KG', label: 'KG (KILOGRAMO)' },
  { value: 'L', label: 'L (LITRO)' },
  { value: 'JGO', label: 'JGO (JUEGO)' },
  { value: 'PAR', label: 'PAR' }
];

const BasePricingCard: React.FC<BasePricingCardProps> = ({
  baseProduct,
  setBaseProduct,
  suppliers = [],
  isLoadingSuppliers,
  onBaseFactorChange,
  hasVariants = false
}) => {
  const [supplierQuery, setSupplierQuery] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [activeSupplierIndex, setActiveSupplierIndex] = useState(0);

  // Estado para bloquear/desbloquear el Nombre Genérico del producto padre
  const [isEditingGenericName, setIsEditingGenericName] = useState(false);
  const genericNameInputRef = useRef<HTMLInputElement>(null);

  const preventNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    const currentSup = suppliers.find(s => s.id === Number(baseProduct.supplierId));
    if (currentSup && !showSupplierDropdown) {
      setSupplierQuery(`#${currentSup.id} - ${currentSup.name}`);
    }
  }, [baseProduct.supplierId, suppliers, showSupplierDropdown]);

  // Autollenar el nombre de la Presentación 1 cuando se agregan variantes
  useEffect(() => {
    if (hasVariants) {
      const currentBaseName = (baseProduct.basePresentationName || '').trim();
      const parentName = (baseProduct.name || '').trim();
      const suffix = `(${baseProduct.baseStockFactor || 1}${baseProduct.unitOfMeasure || 'PZA'})`;

      if (!currentBaseName || currentBaseName === parentName) {
        const alreadyHasParens = /\(.*\)$/.test(parentName);
        setBaseProduct((prev: any) => ({
          ...prev,
          basePresentationName: alreadyHasParens ? parentName : `${parentName} ${suffix}`
        }));
      }
    } else {
      setIsEditingGenericName(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVariants]);

  // Dar foco automático cuando presionan el botón "Editar" del nombre genérico
  useEffect(() => {
    if (isEditingGenericName && genericNameInputRef.current) {
      genericNameInputRef.current.focus();
    }
  }, [isEditingGenericName]);

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
      return { ...prev, baseSalePrice: salePrice, profitMargin: newMargin };
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
      return { ...prev, profitMargin: margin, baseSalePrice: newSale };
    });
  };

  const handleFactorChange = (val: string) => {
    if (val === "") {
      setBaseProduct((prev: any) => ({ ...prev, baseStockFactor: "" }));
      if (onBaseFactorChange) onBaseFactorChange("");
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        const safeNum = Math.max(0, num);
        setBaseProduct((prev: any) => ({ ...prev, baseStockFactor: safeNum }));
        if (onBaseFactorChange) onBaseFactorChange(safeNum);
      }
    }
  };

  return (
    <div id="seccion-base" className="p-6 bg-[#121212] rounded-2xl border border-gray-800 space-y-6">
      <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-3">
        1. Presentación Principal (Base) y Costos
      </h3>

      {/* BLOQUE QUE APARECE CUANDO HAY MÁS DE 1 PRESENTACIÓN */}
      {hasVariants && (
        <div className="p-4 bg-black/40 border border-brand-orange/40 rounded-xl space-y-4 animate-in fade-in duration-200">
          
          {/* ARRIBA: NOMBRE GENÉRICO DESHABILITADO CON BOTÓN PARA EDITAR */}
          <div>
            <label className="block text-xs text-gray-400 font-bold mb-1.5 uppercase">
              Nombre Genérico del Producto (Buscador General)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                ref={genericNameInputRef}
                disabled={!isEditingGenericName}
                value={baseProduct.name}
                onChange={e => setBaseProduct({ ...baseProduct, name: e.target.value })}
                placeholder="Ej. CARBON No.10"
                className={`flex-1 rounded-xl px-4 py-2.5 text-base font-bold transition-all focus:outline-none ${
                  isEditingGenericName
                    ? 'bg-[#1a1a1a] border border-brand-orange text-white'
                    : 'bg-black/60 border border-gray-800 text-gray-400 cursor-not-allowed opacity-75'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsEditingGenericName(!isEditingGenericName)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition-all shrink-0 flex items-center gap-1.5 ${
                  isEditingGenericName
                    ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500 hover:text-black'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
                }`}
              >
                {isEditingGenericName ? '✓ Listo' : '✎ Editar'}
              </button>
            </div>
          </div>

          {/* DEBAJO: NOMBRE DE LA PRESENTACIÓN 1 */}
          <div>
            <label className="block text-xs text-brand-orange font-bold mb-1.5 uppercase">
              Nombre de la Presentación 1 (Base: x{baseProduct.baseStockFactor || 1} {baseProduct.unitOfMeasure || 'PZA'}) *
            </label>
            <input
              type="text"
              value={baseProduct.basePresentationName || ''}
              onChange={e => setBaseProduct({ ...baseProduct, basePresentationName: e.target.value })}
              placeholder={`Ej. ${baseProduct.name} (${baseProduct.baseStockFactor || 1}${baseProduct.unitOfMeasure || 'PZA'})`}
              className="w-full bg-[#1a1a1a] border border-brand-orange/60 text-white text-base rounded-xl px-4 py-2.5 focus:border-brand-orange focus:outline-none font-bold"
            />
          </div>

        </div>
      )}

      {/* PROVEEDOR + UNIDAD DE MEDIDA + FACTOR DE STOCK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div>
          <label className="block text-gray-300 font-bold mb-2">Factor de Stock</label>
          <input
            type="number"
            min="0"
            step="any"
            onKeyDown={preventNegativeKey}
            value={baseProduct.baseStockFactor === "" ? "" : baseProduct.baseStockFactor}
            onChange={e => handleFactorChange(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-700 text-brand-orange text-base rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
          />
        </div>
      </div>

      {/* PRECIOS Y GANANCIA */}
      <div className="pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
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
  );
};

export default BasePricingCard;