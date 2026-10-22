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

  const handleBaseFactorChange = () => {
    if (!isEditing && presentations.length > 0) {
      setFactorChangedWarning(true);
      showNotification("⚠️ El factor cambió, revise las presentaciones antes de continuar.");
    }
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
    }
    showNotification(yaExisteEnBD ? "Se desactivará al guardar los cambios." : "Variante eliminada de la lista.");
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
        />

        {/* 2. BOTÓN Y FORMULARIO DE MÁS VARIANTES (HIJOS) */}
        <VariantFormSection
          baseProduct={baseProduct}
          presentations={presentations}
          setPresentations={setPresentations}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          onDeletePresentation={handleDeletePresentation}
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
        onSelectBase={() => scrollToSection('seccion-base')}
        onSelectVariant={(idx) => {
          scrollToSection('seccion-variantes');
          setEditingIndex(idx);
        }}
        onDeleteVariant={handleDeletePresentation}
      />
    </div>
  );
};

export default ProductStepPresentations;