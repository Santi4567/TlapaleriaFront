// src/components/products/ProductCreateForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types/supplier';
import { CreateProductRequest, CreatePresentationRequest } from '../../types/product';
import ProductStepBase from './ProductStepBase';
import ProductStepPresentations from './ProductStepPresentations';
import ProductStepSummary from './ProductStepSummary';

interface ProductCreateFormProps {
  onCancel: () => void;
  onSave: (productData: CreateProductRequest) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const ProductCreateForm: React.FC<ProductCreateFormProps> = ({ onCancel, onSave, isSubmitting, error }) => {
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  // NUEVO: Estado para nuestra notificación flotante (Toast)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

  const initialBaseProduct = {
    internalCode: '',
    barcode: '',
    name: '',
    description: '',
    brand: '',
    location: '',
    supplierId: 0,
    supplierPrice: "",
    profitMargin: "",
    baseSalePrice: "",
    baseStockFactor: "1", 
    unitOfMeasure: 'PZA',
    isInventoryTracked: true,
    initialStock: "",
    hasExpiration: false,
    nextExpirationDate: ''
  };

  const [baseProduct, setBaseProduct] = useState<any>(initialBaseProduct);
  const [presentations, setPresentations] = useState<CreatePresentationRequest[]>([]);

  useEffect(() => {
    const loadSuppliers = async () => {
      if (!user?.token) return;
      setIsLoadingSuppliers(true);
      const res = await supplierService.getSuppliers(user.token, 1, 100, true);
      if (res && res.success) {
        setSuppliers(res.data.data);
        if (res.data.data.length > 0) {
          setBaseProduct((prev: any) => ({ ...prev, supplierId: res.data.data[0].id }));
        }
      }
      setIsLoadingSuppliers(false);
    };
    loadSuppliers();
  }, [user?.token]);

  // NUEVO: Función para mostrar notificaciones sin usar alert() del sistema
  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000); // Se oculta solo en 4 segundos
  };

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseProduct.name.trim() || !baseProduct.internalCode.trim()) {
      showNotification("Por favor completa al menos el Código Interno y Nombre del producto.");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    // Validar fecha de caducidad si está activa
    if (baseProduct.hasExpiration && baseProduct.nextExpirationDate.length !== 10) {
      showNotification("La fecha de caducidad debe tener el formato completo AAAA-MM-DD.");
      return;
    }

    const basePresentation: CreatePresentationRequest = {
      name: baseProduct.name || "Presentación Base",
      code: baseProduct.internalCode || "BASE",
      barcode: baseProduct.barcode || "",
      price: Number(baseProduct.baseSalePrice || 0),
      stockFactor: Number(baseProduct.baseStockFactor || 1)
    };

    const finalPresentations = [basePresentation, ...presentations];

    const payload: CreateProductRequest = {
      internalCode: baseProduct.internalCode.trim(),
      barcode: baseProduct.barcode?.trim() || "",
      name: baseProduct.name.trim(),
      description: baseProduct.description?.trim() || "",
      brand: baseProduct.brand?.trim() || "",
      location: baseProduct.location?.trim() || "",
      supplierId: Number(baseProduct.supplierId),
      supplierPrice: Number(baseProduct.supplierPrice || 0),
      profitMargin: Number(baseProduct.profitMargin || 0),
      unitOfMeasure: baseProduct.unitOfMeasure.trim().toUpperCase(),
      isInventoryTracked: baseProduct.isInventoryTracked,
      initialStock: baseProduct.isInventoryTracked ? Number(baseProduct.initialStock || 0) : 0,
      hasExpiration: baseProduct.hasExpiration,
      // Solo enviamos la fecha si está bien formada
      nextExpirationDate: baseProduct.hasExpiration && baseProduct.nextExpirationDate.length === 10
        ? new Date(baseProduct.nextExpirationDate).toISOString() 
        : null,
      presentations: finalPresentations
    };
    
    await onSave(payload);
    setBaseProduct(initialBaseProduct);
    setPresentations([]);
    setStep(1);
  };

  const selectedSupplierName = suppliers.find(s => s.id === Number(baseProduct.supplierId))?.name || 'Desconocido';

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative">
      
      {/* NUEVO: NOTIFICACIÓN FLOTANTE (TOAST) */}
      {toastMessage && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] border border-red-400 font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {toastMessage}
          </div>
        </div>
      )}

      {/* CABECERA FIJA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-gray-800 pb-6 flex-shrink-0 gap-4 bg-[#161616] z-20">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Alta de Nuevo Producto</h2>
          <p className="text-gray-400 text-sm mt-1">
            {step === 1 && "Paso 1: Identificación y datos generales del artículo."}
            {step === 2 && "Paso 2: Proveedor, costos, inventario y variantes de venta."}
            {step === 3 && "Paso 3: Verificación jerárquica y confirmación en base de datos."}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 bg-black/50 p-2 rounded-2xl border border-gray-800">
          <span className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${step === 1 ? 'bg-brand-orange text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>
            1. Identificación
          </span>
          <span className="text-gray-600 font-bold">→</span>
          <span className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${step === 2 ? 'bg-brand-orange text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>
            2. Costos y Variantes
          </span>
          <span className="text-gray-600 font-bold">→</span>
          <span className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${step === 3 ? 'bg-brand-orange text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>
            3. Resumen
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold flex-shrink-0">
          {error}
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 flex flex-col relative"
      >
        
        {step === 1 && (
          <div style={{ animation: 'fadeInSlide 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }} className="w-full flex-1 flex flex-col min-h-full">
            <ProductStepBase 
              baseProduct={baseProduct}
              setBaseProduct={setBaseProduct}
              onCancel={onCancel}
              onNext={handleNextToStep2}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeInSlide 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }} className="w-full flex-1 flex flex-col min-h-full">
            <ProductStepPresentations 
              baseProduct={baseProduct}
              setBaseProduct={setBaseProduct}
              suppliers={suppliers}
              isLoadingSuppliers={isLoadingSuppliers}
              presentations={presentations}
              setPresentations={setPresentations}
              onBackToBase={() => setStep(1)}
              onFinishToSummary={() => setStep(3)}
              showNotification={showNotification} // Pasamos la función al hijo
            />
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeInSlide 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }} className="w-full flex-1 flex flex-col min-h-full">
            <ProductStepSummary 
              baseProduct={baseProduct}
              presentations={presentations}
              supplierName={selectedSupplierName}
              onBackToEdit={() => setStep(2)}
              onConfirmSave={handleFinalSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

    </div>
  );
};

export default ProductCreateForm;