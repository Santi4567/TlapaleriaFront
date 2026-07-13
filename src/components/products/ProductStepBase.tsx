// src/components/products/ProductStepBase.tsx
import React from 'react';
import { Supplier } from '../../types/supplier';

interface ProductStepBaseProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  suppliers: Supplier[];
  isLoadingSuppliers: boolean;
  onCancel: () => void;
  onNextToPresentations: (e: React.FormEvent) => void;
  onDirectToSummary: (e: React.FormEvent) => void;
}

const ProductStepBase: React.FC<ProductStepBaseProps> = ({
  baseProduct,
  setBaseProduct,
  suppliers,
  isLoadingSuppliers,
  onCancel,
  onNextToPresentations,
  onDirectToSummary
}) => {
  
  const handleNumberChange = (field: string, value: string, isFloat: boolean = false) => {
    if (value === "") {
      setBaseProduct((prev: any) => ({ ...prev, [field]: "" }));
    } else {
      const num = isFloat ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(num)) {
        setBaseProduct((prev: any) => ({ ...prev, [field]: num }));
      }
    }
  };

  return (
    <form className="space-y-6 max-w-4xl pb-10">
      
      {/* CÓDIGOS Y MARCA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-gray-300 font-bold mb-2">Código Interno / SKU *</label>
          <input 
            type="text" autoFocus placeholder="Ej. CAB-12-R" value={baseProduct.internalCode}
            onChange={e => setBaseProduct({...baseProduct, internalCode: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Código de Barras Base</label>
          <input 
            type="text" placeholder="Ej. 75010000002" value={baseProduct.barcode}
            onChange={e => setBaseProduct({...baseProduct, barcode: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Marca</label>
          <input 
            type="text" placeholder="Ej. IUSA, Truper, Cruz Azul" value={baseProduct.brand}
            onChange={e => setBaseProduct({...baseProduct, brand: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
          />
        </div>
      </div>

      {/* NOMBRE Y UBICACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-gray-300 font-bold mb-2">Nombre Genérico del Artículo *</label>
          <input 
            type="text" placeholder="Ej. Cable THW Calibre 12 Rojo" value={baseProduct.name}
            onChange={e => setBaseProduct({...baseProduct, name: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Ubicación en Piso / Almacén</label>
          <input 
            type="text" placeholder="Ej. Pasillo 2, Estante C" value={baseProduct.location}
            onChange={e => setBaseProduct({...baseProduct, location: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
          />
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="block text-gray-300 font-bold mb-2">Descripción Detallada</label>
        <textarea 
          rows={2} placeholder="Ej. Cable de cobre con aislamiento de PVC para uso residencial..." value={baseProduct.description}
          onChange={e => setBaseProduct({...baseProduct, description: e.target.value})}
          className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
        />
      </div>

      {/* PROVEEDOR Y COSTOS CON EL SELECT OSCURO Y PRECIO VENTA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#121212] rounded-2xl border border-gray-800">
        <div>
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
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id} className="bg-[#1a1a1a] text-white py-2">
                  {sup.name} ({sup.contactName})
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Precio Compra ($)</label>
          <input 
            type="number" step="0.01" 
            value={baseProduct.supplierPrice === "" ? "" : baseProduct.supplierPrice}
            onChange={e => handleNumberChange("supplierPrice", e.target.value, true)}
            className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Margen (%)</label>
          <input 
            type="number" step="1" 
            value={baseProduct.profitMargin === "" ? "" : baseProduct.profitMargin}
            onChange={e => handleNumberChange("profitMargin", e.target.value, false)}
            className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-base rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-brand-orange font-bold mb-2">Precio Venta ($) *</label>
          <input 
            type="number" step="0.01" 
            placeholder="0.00"
            value={baseProduct.baseSalePrice === "" ? "" : baseProduct.baseSalePrice}
            onChange={e => handleNumberChange("baseSalePrice", e.target.value, true)}
            className="w-full bg-[#1a1a1a] border border-brand-orange/50 text-brand-orange text-lg rounded-xl px-3 py-3 focus:border-brand-orange focus:outline-none font-mono font-black"
          />
        </div>
      </div>

      {/* REGLAS DE INVENTARIO Y CADUCIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-[#121212] rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-bold text-lg">¿Es producto Stockeable?</h4>
              <p className="text-xs text-gray-400">Si lo apagas, el inventario será N/S</p>
            </div>
            <button
              type="button"
              onClick={() => setBaseProduct({...baseProduct, isInventoryTracked: !baseProduct.isInventoryTracked})}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.isInventoryTracked ? 'bg-brand-orange' : 'bg-gray-700'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.isInventoryTracked ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-xs text-gray-400 font-bold mb-1">Unidad Base</label>
              <input 
                type="text" placeholder="KG, METRO, PZA..." value={baseProduct.unitOfMeasure}
                onChange={e => setBaseProduct({...baseProduct, unitOfMeasure: e.target.value.toUpperCase()})}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 font-bold uppercase"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs text-gray-400 font-bold mb-1">Stock Inicial</label>
              <input 
                type="number" step="1" disabled={!baseProduct.isInventoryTracked}
                value={baseProduct.initialStock === "" ? "" : baseProduct.initialStock}
                onChange={e => handleNumberChange("initialStock", e.target.value, false)}
                className={`w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 font-mono font-bold ${!baseProduct.isInventoryTracked ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#121212] rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-bold text-lg">¿Tiene Caducidad?</h4>
              <p className="text-xs text-gray-400">Para químicos, pinturas o cementos</p>
            </div>
            <button
              type="button"
              onClick={() => setBaseProduct({...baseProduct, hasExpiration: !baseProduct.hasExpiration})}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${baseProduct.hasExpiration ? 'bg-brand-orange' : 'bg-gray-700'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${baseProduct.hasExpiration ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 font-bold mb-1">Fecha de Vencimiento</label>
            <input 
              type="date" style={{ colorScheme: 'dark' }} disabled={!baseProduct.hasExpiration}
              value={baseProduct.nextExpirationDate}
              onChange={e => setBaseProduct({...baseProduct, nextExpirationDate: e.target.value})}
              className={`w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-2 ${!baseProduct.hasExpiration ? 'opacity-30 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
        <button 
          type="button" onClick={onCancel}
          className="px-6 py-4 rounded-xl border border-gray-700 text-gray-400 font-bold hover:bg-gray-800 transition-colors"
        >
          Cancelar y Volver al Catálogo
        </button>
        
        <div className="flex space-x-4">
          <button 
            onClick={onDirectToSummary}
            className="px-6 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors shadow-lg"
          >
            Finalizar Presentación (Artículo Simple)
          </button>
          <button 
            onClick={onNextToPresentations}
            className="px-8 py-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-black font-extrabold transition-colors shadow-lg flex items-center"
          >
            Agregar Múltiples Presentaciones →
          </button>
        </div>
      </div>

    </form>
  );
};

export default ProductStepBase;