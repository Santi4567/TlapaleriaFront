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
  stockFactor: 1
};

const VariantFormSection: React.FC<VariantFormSectionProps> = ({
  baseProduct,
  presentations,
  setPresentations,
  editingIndex,
  setEditingIndex,
  onDeletePresentation,
  showNotification,
  factorChangedWarning = false,
  onDismissFactorWarning
}) => {
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [hasCustomCode, setHasCustomCode] = useState(false);
  const [hasCustomBarcode, setHasCustomBarcode] = useState(false);
  const [currentPres, setCurrentPres] = useState<any>(EMPTY_VARIANT);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Si desde el Sidebar hacen clic en editar una variante, abrimos el formulario y cargamos sus datos
  useEffect(() => {
    if (editingIndex !== null && presentations[editingIndex]) {
      const item = presentations[editingIndex];
      setCurrentPres(item);
      setHasCustomCode(item.code !== baseProduct.internalCode);
      setHasCustomBarcode(item.barcode !== baseProduct.barcode && item.barcode !== "");
      setIsVariantFormOpen(true);
    }
  }, [editingIndex, presentations, baseProduct.internalCode, baseProduct.barcode]);

  // Posiciona el cursor al final del nombre automáticamente cuando se abre el formulario
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

  const handleNumberChange = (field: string, value: string) => {
    if (value === "") {
      setCurrentPres((prev: any) => ({ ...prev, [field]: "" }));
    } else {
      const rawNum = parseFloat(value);
      if (!isNaN(rawNum)) {
        setCurrentPres((prev: any) => ({ ...prev, [field]: Math.max(0, rawNum) }));
      }
    }
  };

  // Abre el formulario para una NUEVA variante precargando el nombre del producto padre
  const handleOpenNewVariant = () => {
    const defaultName = baseProduct.name ? `${baseProduct.name.trim()} ` : '';
    setCurrentPres({
      ...EMPTY_VARIANT,
      name: defaultName
    });
    setHasCustomCode(false);
    setHasCustomBarcode(false);
    setEditingIndex(null);
    setIsVariantFormOpen(true);
  };

  // Cancela / cierra el formulario y limpia absolutamente todos los campos de la variante
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
      name: currentPres.name.trim(),
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
    } else {
      setPresentations([...presentations, updatedPres]);
    }

    handleCancelForm();
  };

  return (
    <div id="seccion-variantes" className="p-6 bg-[#121212] rounded-2xl border border-gray-800 space-y-6">
      <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">2. Variantes / Formas de Venta (Hijos)</h3>
          <p className="text-xs text-gray-400 mt-0.5">Si se vende por Kilo, Litro, Metro o Medio Bulto, agrégalo aquí.</p>
        </div>
      </div>

      {/* BANNER DE ADVERTENCIA SI CAMBIÓ EL FACTOR DEL PADRE YA CON PRESENTACIONES */}
      {factorChangedWarning && presentations.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl flex items-center justify-between text-yellow-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="text-lg">⚠️</span>
            <span>
              El factor cambió (ahora Padre = {baseProduct.baseStockFactor || 1}), revise las presentaciones antes de continuar.
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
          <div className="flex justify-between items-center mb-2">
            <span className="bg-brand-orange/20 text-brand-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {editingIndex !== null ? 'Editando Variante' : 'Creando Nueva Variante'}
            </span>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-red-400 font-bold text-sm px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              ✕ Cancelar / Cerrar
            </button>
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-2">Nombre Empaque/Unidad *</label>
            <input
              type="text"
              ref={nameInputRef}
              placeholder="Ej. Venta por Metro, Kilo Suelto"
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
                  placeholder="Ej. CAB-ROL"
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
              <label className="block text-brand-orange font-bold mb-2">Precio de Venta ($) *</label>
              <input
                type="number"
                min="0"
                step="any"
                onKeyDown={preventNegativeKey}
                value={currentPres.price}
                onChange={e => handleNumberChange("price", e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-2xl font-black rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono text-brand-orange"
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
                onChange={e => handleNumberChange("supplierPrice", e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-bold mb-2">
                Factor de Stock (Padre = {baseProduct.baseStockFactor === "" ? 1 : baseProduct.baseStockFactor})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                onKeyDown={preventNegativeKey}
                value={currentPres.stockFactor === "" ? "" : currentPres.stockFactor}
                onChange={e => handleNumberChange("stockFactor", e.target.value)}
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
                onClick={() => {
                  onDeletePresentation(editingIndex);
                  handleCancelForm();
                }}
                className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold transition-all border border-red-500/30 flex items-center shadow-md"
              >
                🗑️ Eliminar esta Variante
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 font-bold transition-all"
              >
                Cancelar Variante
              </button>
            )}

            <button
              type="button"
              onClick={handleSavePresentation}
              className="px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-brand-orange font-extrabold text-lg transition-colors border border-gray-700 shadow-md"
            >
              {editingIndex !== null ? '✓ Guardar Cambios en Variante' : '+ Guardar Variante en Lista'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantFormSection;