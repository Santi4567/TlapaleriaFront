// src/components/products/VariantFormSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CreatePresentationRequest } from '../../types/product';

interface VariantFormSectionProps {
  baseProduct: any;
  presentations: CreatePresentationRequest[];
  setPresentations: React.Dispatch<React.SetStateAction<CreatePresentationRequest[]>>;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onDeletePresentation: (idx: number) => void;
  onRecalculateFromLargest: () => void; // <-- NUEVO
  showNotification: (msg: string) => void;
  factorChangedWarning?: boolean; 
  onDismissFactorWarning?: () => void; 
}

const EMPTY_VARIANT = {
  name: '',
  code: '',
  barcode: '',
  price: "",
  supplierPrice: "",
  stockFactor: 1,
  isActive: true
};

const VariantFormSection: React.FC<VariantFormSectionProps> = ({
  baseProduct,
  presentations,
  setPresentations,
  editingIndex,
  setEditingIndex,
  onDeletePresentation,
  onRecalculateFromLargest,
  showNotification,
  factorChangedWarning = false,
  onDismissFactorWarning
}) => {
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [hasCustomCode, setHasCustomCode] = useState(false);
  const [hasCustomBarcode, setHasCustomBarcode] = useState(false);
  const [currentPres, setCurrentPres] = useState<any>(EMPTY_VARIANT);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Obtener la presentación mayor actual (entre la Base y las hijas) para sugerir precios en vivo
  const getLargestReference = () => {
    const all = [
      {
        stockFactor: Number(baseProduct.baseStockFactor) || 0,
        supplierPrice: Number(baseProduct.supplierPrice) || 0
      },
      ...presentations.map(p => ({
        stockFactor: Number(p.stockFactor) || 0,
        supplierPrice: Number(p.supplierPrice) || 0
      }))
    ];
    return all.reduce((prev, curr) => (curr.stockFactor > prev.stockFactor ? curr : prev), all[0]);
  };

  useEffect(() => {
    if (editingIndex !== null && presentations[editingIndex]) {
      const item = presentations[editingIndex];
      setCurrentPres({
        ...item,
        isActive: item.isActive !== false
      });
      setHasCustomCode(item.code !== baseProduct.internalCode);
      setHasCustomBarcode(item.barcode !== baseProduct.barcode && item.barcode !== "");
      setIsVariantFormOpen(true);
    }
  }, [editingIndex, presentations, baseProduct.internalCode, baseProduct.barcode]);

  useEffect(() => {
    if (isVariantFormOpen && nameInputRef.current) {
      const input = nameInputRef.current;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [isVariantFormOpen]);

  const preventNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  // Calcula costo y precio sugeridos dado un factor usando la presentación más grande
  const calculateSuggestedPrices = (targetFactor: number, isActiveFlag: boolean) => {
    const largest = getLargestReference();
    if (largest.stockFactor <= 0 || largest.supplierPrice <= 0 || targetFactor <= 0) {
      return null;
    }
    const unitCost = largest.supplierPrice / largest.stockFactor;
    const suggestedCost = Number((unitCost * targetFactor).toFixed(2));
    const margin = Number(baseProduct.profitMargin) || 0;
    const suggestedSalePrice = isActiveFlag
      ? Number((suggestedCost * (1 + margin / 100)).toFixed(2))
      : 0;

    return { suggestedCost, suggestedSalePrice };
  };

  const handleNumberChange = (field: string, value: string) => {
    if (value === "") {
      setCurrentPres((prev: any) => ({ ...prev, [field]: "" }));
      return;
    }
    const rawNum = parseFloat(value);
    if (isNaN(rawNum)) return;
    const safeNum = Math.max(0, rawNum);

    // Si cambia el Factor de Stock de la variante, autocalculamos Costo Proveedor y Precio Venta sugeridos
    if (field === "stockFactor") {
      const suggestions = calculateSuggestedPrices(safeNum, currentPres.isActive !== false);
      if (suggestions) {
        setCurrentPres((prev: any) => ({
          ...prev,
          stockFactor: safeNum,
          supplierPrice: suggestions.suggestedCost,
          price: prev.isActive !== false ? suggestions.suggestedSalePrice : prev.price
        }));
        return;
      }
    }

    setCurrentPres((prev: any) => ({ ...prev, [field]: safeNum }));
  };

  const handleOpenNewVariant = () => {
    const defaultName = baseProduct.name ? `${baseProduct.name.trim()} ` : '';
    const defaultFactor = 1;
    const suggestions = calculateSuggestedPrices(defaultFactor, true);

    setCurrentPres({
      ...EMPTY_VARIANT,
      name: defaultName,
      stockFactor: defaultFactor,
      supplierPrice: suggestions ? suggestions.suggestedCost : "",
      price: suggestions ? suggestions.suggestedSalePrice : "",
      isActive: true
    });
    setHasCustomCode(false);
    setHasCustomBarcode(false);
    setEditingIndex(null);
    setIsVariantFormOpen(true);
  };

  const handleCancelForm = () => {
    setCurrentPres(EMPTY_VARIANT);
    setHasCustomCode(false);
    setHasCustomBarcode(false);
    setEditingIndex(null);
    setIsVariantFormOpen(false);
  };

  const handleSavePresentation = (e: React.MouseEvent) => {
    e.preventDefault();
    const finalCode = hasCustomCode && currentPres.code.trim() !== '' ? currentPres.code.trim() : baseProduct.internalCode;
    const finalBarcode = hasCustomBarcode && currentPres.barcode.trim() !== '' ? currentPres.barcode.trim() : baseProduct.barcode;
    const isForSale = currentPres.isActive !== false;

    if (!currentPres.name.trim() || !finalCode) {
      showNotification("Llena el Nombre de la variante y asegúrate de tener un Código.");
      return;
    }

    if (isForSale && Number(currentPres.price) <= 0) {
      showNotification("Si la variante está activa para venta al público, debe tener un Precio mayor a $0.");
      return;
    }

    if (currentPres.supplierPrice === "" || Number(currentPres.supplierPrice) < 0) {
      showNotification("El Costo de Proveedor de esta variante no puede estar vacío ni ser negativo.");
      return;
    }

    const updatedPres: CreatePresentationRequest = {
      ...currentPres,
      name: currentPres.name.trim(),
      code: finalCode,
      barcode: finalBarcode || "",
      price: isForSale ? Math.max(0, Number(currentPres.price)) : Math.max(0, Number(currentPres.price || 0)),
      supplierPrice: Math.max(0, Number(currentPres.supplierPrice)),
      stockFactor: Math.max(0.0001, Number(currentPres.stockFactor || 1)),
      isActive: isForSale
    };

    if (editingIndex !== null) {
      const newList = [...presentations];
      newList[editingIndex] = updatedPres;
      setPresentations(newList);
    } else {
      setPresentations([...presentations, updatedPres]);
    }

    handleCancelForm();
  };

  const isCurrentForSale = currentPres.isActive !== false;

  return (
    <div id="seccion-variantes" className="p-6 bg-[#121212] rounded-2xl border border-gray-800 space-y-6">
      <div className="border-b border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">2. Variantes / Formas de Venta (Hijos)</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Agrega las presentaciones sueltas (Pieza, Kilo, Medio Kilo). El costo se sugiere automáticamente desde la presentación mayor.
          </p>
        </div>

        {presentations.length > 0 && (
          <button
            type="button"
            onClick={onRecalculateFromLargest}
            className="px-4 py-2 bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-black border border-brand-orange/40 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
            title="Toma el costo y factor de la presentación más grande y recalcula costos y precios sugeridos de las demás"
          >
            ⚡ Recalcular Precios desde Presentación Mayor
          </button>
        )}
      </div>

      {/* BANNER DE ADVERTENCIA SI CAMBIÓ EL FACTOR DEL PADRE YA CON PRESENTACIONES */}
      {factorChangedWarning && presentations.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl flex items-center justify-between text-yellow-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="text-lg">⚠️</span>
            <span>
              El factor o costo base cambió. Puedes usar el botón "⚡ Recalcular Precios" para actualizar las variantes.
            </span>
          </div>
          {onDismissFactorWarning && (
            <button
              type="button"
              onClick={onDismissFactorWarning}
              className="text-xs font-extrabold bg-yellow-500/20 hover:bg-yellow-500 hover:text-black px-3 py-1.5 rounded-lg transition-colors shrink-0 ml-4"
            >
              Entendido
            </button>
          )}
        </div>
      )}

      {!isVariantFormOpen ? (
        <button
          type="button"
          onClick={handleOpenNewVariant}
          className="w-full py-6 border-2 border-dashed border-gray-700 hover:border-brand-orange text-gray-400 hover:text-brand-orange font-bold rounded-2xl transition-all flex items-center justify-center text-lg"
        >
          + Agregar Nueva Presentación / Variante
        </button>
      ) : (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
            <span className="bg-brand-orange/20 text-brand-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {editingIndex !== null ? 'Editando Variante' : 'Creando Nueva Variante'}
            </span>

            <div className="flex items-center gap-4">
              {/* SWITCH ACTIVA / INACTIVA PARA ESTA VARIANTE */}
              <div
                onClick={() => setCurrentPres((prev: any) => ({ ...prev, isActive: !isCurrentForSale }))}
                className="flex items-center gap-2.5 cursor-pointer bg-black/40 px-3 py-1.5 rounded-xl border border-gray-800 hover:border-gray-600"
              >
                <span className={`text-xs font-extrabold uppercase ${isCurrentForSale ? 'text-green-400' : 'text-gray-400'}`}>
                  {isCurrentForSale ? '✓ Activa en Caja' : '🚫 Desactivada / Oculta'}
                </span>
                <button
                  type="button"
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isCurrentForSale ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${isCurrentForSale ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-red-400 font-bold text-sm px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-2">Nombre Empaque/Unidad *</label>
            <input
              type="text"
              ref={nameInputRef}
              placeholder="Ej. Pieza Suelta, Kilo, Medio Kilo"
              value={currentPres.name}
              onChange={e => setCurrentPres({ ...currentPres, name: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-300">¿Tiene Código de Variante propio?</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !hasCustomCode;
                    setHasCustomCode(nextState);
                    if (!nextState) setCurrentPres((prev: any) => ({ ...prev, code: '' }));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCustomCode ? 'bg-brand-orange' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${hasCustomCode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {hasCustomCode ? (
                <input
                  type="text"
                  placeholder="Ej. ALA-MKG"
                  value={currentPres.code}
                  onChange={e => setCurrentPres({ ...currentPres, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#1a1a1a] border border-brand-orange/50 text-white text-sm rounded-lg px-3 py-2 font-mono focus:outline-none"
                />
              ) : (
                <p className="text-xs text-gray-500 italic font-mono py-2">
                  Código base: <strong className="text-gray-300">{baseProduct.internalCode || 'Sin SKU'}</strong>
                </p>
              )}
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-300">¿Tiene Barcode propio?</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !hasCustomBarcode;
                    setHasCustomBarcode(nextState);
                    if (!nextState) setCurrentPres((prev: any) => ({ ...prev, barcode: '' }));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasCustomBarcode ? 'bg-brand-orange' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${hasCustomBarcode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {hasCustomBarcode ? (
                <input
                  type="text"
                  placeholder="Ej. 75010000002-B"
                  value={currentPres.barcode}
                  onChange={e => setCurrentPres({ ...currentPres, barcode: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-brand-orange/50 text-white text-sm rounded-lg px-3 py-2 font-mono focus:outline-none"
                />
              ) : (
                <p className="text-xs text-gray-500 italic font-mono py-2">
                  Barcode base: <strong className="text-gray-300">{baseProduct.barcode || 'Sin barcode'}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-300 font-bold mb-2">
                1. Factor de Stock ({baseProduct.unitOfMeasure || 'PZA'}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Ej. 1 o 0.5"
                onKeyDown={preventNegativeKey}
                value={currentPres.stockFactor === "" ? "" : currentPres.stockFactor}
                onChange={e => handleNumberChange("stockFactor", e.target.value)}
                className="w-full bg-[#1a1a1a] border border-brand-orange/60 text-brand-orange text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-2">2. Costo Proveedor ($) *</label>
              <input
                type="number"
                min="0"
                step="any"
                onKeyDown={preventNegativeKey}
                placeholder="Autocalculado"
                value={currentPres.supplierPrice}
                onChange={e => handleNumberChange("supplierPrice", e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-brand-orange font-bold mb-2">
                3. Precio de Venta ($) {isCurrentForSale ? '*' : '(Opcional)'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                disabled={!isCurrentForSale}
                placeholder={isCurrentForSale ? "0.00" : "Desactivada"}
                onKeyDown={preventNegativeKey}
                value={currentPres.price}
                onChange={e => handleNumberChange("price", e.target.value)}
                className={`w-full text-2xl font-black rounded-xl px-4 py-3 focus:outline-none font-mono ${
                  isCurrentForSale
                    ? 'bg-[#1a1a1a] border border-gray-700 focus:border-brand-orange text-brand-orange'
                    : 'bg-black/40 border border-gray-800 text-gray-500 cursor-not-allowed opacity-60'
                }`}
              />
            </div>
          </div>

          {isCurrentForSale && Number(currentPres.price) > 0 && currentPres.supplierPrice !== "" && (
            (() => {
              const precio = Number(currentPres.price);
              const costo = Number(currentPres.supplierPrice);
              const gananciaSobreCosto = costo > 0 ? ((precio - costo) / costo) * 100 : 100;
              const esRiesgoso = gananciaSobreCosto < 15;
              return (
                <div className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-between ${esRiesgoso ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                  <span>{esRiesgoso ? '⚠️ Ganancia baja o negativa sobre costo' : '✓ Ganancia sobre costo saludable'}</span>
                  <span>+{gananciaSobreCosto.toFixed(1)}%</span>
                </div>
              );
            })()
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 font-bold transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSavePresentation}
              className="px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-brand-orange font-extrabold text-lg transition-colors border border-gray-700 shadow-md"
            >
              {editingIndex !== null ? '✓ Actualizar Variante en Lista' : '+ Agregar Variante a la Lista'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantFormSection;