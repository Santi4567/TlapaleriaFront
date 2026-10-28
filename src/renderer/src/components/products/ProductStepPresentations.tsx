// src/components/products/ProductStepPresentations.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CreatePresentationRequest } from '../../types/product';
import { Supplier } from '../../types/supplier';
import BasePricingCard from './BasePricingCard';
import InventoryAccordions from './InventoryAccordions';
import VariantFormSection from './VariantFormSection';
import PresentationsSidebar from './PresentationsSidebar';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [factorChangedWarning, setFactorChangedWarning] = useState(false);
  const isEditing = !!baseProduct.id;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calcula cuál es el StockFactor más alto entre la Base y todas las Variantes
  const maxStockFactor = Math.max(
    Number(baseProduct.baseStockFactor) || 0,
    ...presentations.map(p => Number(p.stockFactor) || 0)
  );

  const handleBaseFactorChange = () => {
    if (presentations.length > 0) {
      setFactorChangedWarning(true);
    }
  };

  // FUNCIÓN ESTRELLA: Toma la presentación con mayor StockFactor y recalcula costos y precios sugeridos de las demás
  const handleRecalculateFromLargest = () => {
    const baseFactor = Number(baseProduct.baseStockFactor) || 0;
    const baseCost = Number(baseProduct.supplierPrice) || 0;

    // Armamos lista completa para identificar cuál tiene el factor más grande
    let largestFactor = baseFactor;
    let largestCost = baseCost;

    presentations.forEach(p => {
      if (Number(p.stockFactor) > largestFactor) {
        largestFactor = Number(p.stockFactor);
        largestCost = Number(p.supplierPrice);
      }
    });

    if (largestFactor <= 0 || largestCost <= 0) {
      showNotification("Ingresa primero el Factor de Stock y Precio Proveedor de la presentación mayor.");
      return;
    }

    const costPerUnit = largestCost / largestFactor;
    const margin = Number(baseProduct.profitMargin) || 0;

    // Si la presentación base NO era la mayor, también le actualizamos su costo sugerido
    if (baseFactor < largestFactor && baseFactor > 0) {
      const newBaseCost = Number((costPerUnit * baseFactor).toFixed(2));
      const newBaseSale = baseProduct.baseIsActive !== false
        ? Math.round(newBaseCost * (1 + margin / 100))
        : baseProduct.baseSalePrice;
      setBaseProduct((prev: any) => ({
        ...prev,
        supplierPrice: newBaseCost,
        baseSalePrice: newBaseSale
      }));
    }

    // Actualizamos las variantes hijas
    const updatedChildren = presentations.map(p => {
      const f = Number(p.stockFactor) || 0;
      const isAct = p.isActive !== false;
      if (f === largestFactor) {
        return p; // La mayor se queda con su costo original
      }
      const newCost = Number((costPerUnit * f).toFixed(2));
      const newPrice = isAct ? Math.round(newCost * (1 + margin / 100)) : Number(p.price || 0);
      return {
        ...p,
        supplierPrice: newCost,
        price: newPrice
      };
    });

    setPresentations(updatedChildren);
    setFactorChangedWarning(false);
    showNotification(`✓ Costos y precios recalculados ($${costPerUnit.toFixed(2)} por 1 ${baseProduct.unitOfMeasure || 'unidad'}).`);
  };

  const handleToggleVariantActive = (idx: number) => {
    setPresentations(prev =>
      prev.map((item, i) => (i === idx ? { ...item, isActive: item.isActive === false } : item))
    );
  };

  const handleDeletePresentation = (idx: number) => {
    const item = presentations[idx];
    const yaExisteEnBD = !!item.id && Number(item.id) > 0;

    if (yaExisteEnBD) {
      // Si ya existe en BD, en vez de borrarla del arreglo, simplemente la ponemos inactiva para que siga visible
      handleToggleVariantActive(idx);
      showNotification(`"${item.name}" cambió su estado activo/inactivo.`);
      return;
    }

    setPresentations(presentations.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      setEditingIndex(null);
    }
    showNotification("Variante nueva quitada de la lista.");
  };

  const validateAndFinish = useCallback(() => {
    if (!baseProduct.unitOfMeasure || !baseProduct.supplierId || Number(baseProduct.supplierId) === 0) {
      showNotification("La Unidad de Medida y el Proveedor son obligatorios.");
      return;
    }
    if (baseProduct.supplierPrice === "" || Number(baseProduct.supplierPrice) < 0) {
      showNotification("El Precio de Proveedor no puede estar vacío ni ser negativo.");
      return;
    }

    const isBaseActive = baseProduct.baseIsActive !== false;
    const activeVariants = presentations.filter(p => p.isActive !== false);

    // Regla: Al menos 1 presentación (la Base o alguna Variante) debe estar activa para venderse en mostrador
    if (!isBaseActive && activeVariants.length === 0) {
      showNotification("Debes dejar al menos una presentación activa para venta al público.");
      return;
    }

    if (isBaseActive && (!baseProduct.baseSalePrice || Number(baseProduct.baseSalePrice) <= 0)) {
      showNotification("La Presentación Base está activa para venta al público y requiere un Precio mayor a $0.");
      return;
    }

    if (baseProduct.hasExpiration && (!baseProduct.nextExpirationDate || baseProduct.nextExpirationDate.length !== 10)) {
      showNotification("Activaste 'Tiene Caducidad', por favor selecciona la Fecha de Vencimiento.");
      return;
    }
    onFinishToSummary();
  }, [baseProduct, presentations, onFinishToSummary, showNotification]);

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

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-16">
      <div className="flex-1 space-y-8">
        
        {/* 1. FORMULARIO DE 1ra PRESENTACIÓN (BASE) */}
        <BasePricingCard
          baseProduct={baseProduct}
          setBaseProduct={setBaseProduct}
          suppliers={suppliers}
          isLoadingSuppliers={isLoadingSuppliers}
          onBaseFactorChange={handleBaseFactorChange}
          hasVariants={presentations.length > 0}
          isLargestPresentation={(Number(baseProduct.baseStockFactor) || 0) >= maxStockFactor}
        />

        {/* 2. BOTÓN Y FORMULARIO DE MÁS VARIANTES (HIJOS) */}
        <VariantFormSection
          baseProduct={baseProduct}
          presentations={presentations}
          setPresentations={setPresentations}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          onDeletePresentation={handleDeletePresentation}
          onRecalculateFromLargest={handleRecalculateFromLargest}
          showNotification={showNotification}
          factorChangedWarning={factorChangedWarning}
          onDismissFactorWarning={() => setFactorChangedWarning(false)}
        />

        {/* 3. HASTA ABAJO: CONFIGURACIONES DE STOCK, FECHA DE CADUCIDAD Y FRACCIONABLE */}
        <div className="pt-2">
          <h3 className="text-lg font-bold text-gray-300 mb-4 px-1">
            3. Configuraciones de Inventario, Caducidad y Venta Fraccionada
          </h3>
          <InventoryAccordions
            baseProduct={baseProduct}
            setBaseProduct={setBaseProduct}
            isEditing={isEditing}
          />
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
          <button
            type="button"
            onClick={onBackToBase}
            className="px-6 py-4 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition-colors"
          >
            ← Regresar (Identificación)
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              validateAndFinish();
            }}
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

      {/* BARRA LATERAL DERECHA */}
      <PresentationsSidebar
        baseProduct={baseProduct}
        presentations={presentations}
        maxStockFactor={maxStockFactor}
        onSelectBase={() => scrollToSection('seccion-base')}
        onToggleBaseActive={() =>
          setBaseProduct((prev: any) => ({ ...prev, baseIsActive: prev.baseIsActive === false }))
        }
        onSelectVariant={(idx) => {
          scrollToSection('seccion-variantes');
          setEditingIndex(idx);
        }}
        onToggleVariantActive={handleToggleVariantActive}
        onDeleteVariant={handleDeletePresentation}
      />
    </div>
  );
};

export default ProductStepPresentations;