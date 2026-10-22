// src/components/products/InventoryAccordions.tsx
import React from 'react';
import CustomDatePicker from '../CustomDatePicker';

interface InventoryAccordionsProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  isEditing: boolean;
}

const InventoryAccordions: React.FC<InventoryAccordionsProps> = ({
  baseProduct,
  setBaseProduct,
  isEditing
}) => {
  const preventNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleInitialStockChange = (val: string) => {
    if (isEditing) return;
    if (val === "") {
      setBaseProduct((prev: any) => ({ ...prev, initialStock: "" }));
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setBaseProduct((prev: any) => ({ ...prev, initialStock: Math.max(0, num) }));
      }
    }
  };

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

  return (
    <div className="space-y-4">
      {/* SELECTOR 1: CONTROL DE STOCK */}
      <div className={`p-5 bg-[#121212] rounded-2xl border transition-all duration-200 ${baseProduct.isInventoryTracked ? 'border-brand-orange/60 shadow-lg' : 'border-gray-800'}`}>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setBaseProduct({ ...baseProduct, isInventoryTracked: !baseProduct.isInventoryTracked })}
        >
          <div>
            <h4 className="text-white font-bold text-lg">¿Control de Stock?</h4>
            <p className="text-xs text-gray-400">
              {baseProduct.isInventoryTracked
                ? 'Habilitado: Se llevará conteo de existencias en almacén.'
                : 'Apagado (N/S): No se descontará inventario al vender.'}
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
                onChange={e => handleInitialStockChange(e.target.value)}
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

      {/* SELECTOR 2: TIENE CADUCIDAD */}
      <div className={`p-5 bg-[#121212] rounded-2xl border transition-all duration-200 ${baseProduct.hasExpiration ? 'border-brand-orange/60 shadow-lg' : 'border-gray-800'}`}>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setBaseProduct({ ...baseProduct, hasExpiration: !baseProduct.hasExpiration })}
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
          onClick={() => setBaseProduct({ ...baseProduct, allowFractions: !baseProduct.allowFractions })}
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
  );
};

export default InventoryAccordions;