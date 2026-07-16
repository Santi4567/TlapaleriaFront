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
  productToEdit?: any | null; // NUEVO: Si trae datos, es Edición
  onCancel: () => void;
  onSave: (productData: any, isEditing: boolean) => Promise<void>; // Avisa si es update o create
  onDeactivate?: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const ProductCreateForm: React.FC<ProductCreateFormProps> = ({ productToEdit, onCancel, onSave, onDeactivate, isSubmitting, error }) => {
  const { user } = useAuth();
  const isEditing = !!productToEdit; // Variable booleana rápida

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [step]);

  const initialBaseProduct = {
    id: null,
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
    basePresentationId: null, // ID de la presentación padre para el backend
    unitOfMeasure: 'PZA',
    isInventoryTracked: true,
    initialStock: "",
    hasExpiration: false,
    nextExpirationDate: ''
  };

  const [baseProduct, setBaseProduct] = useState<any>(initialBaseProduct);
  const [presentations, setPresentations] = useState<any[]>([]); // Usamos any[] porque ahora pueden tener Id

  // ==============================================================
  // ADAPTADOR DE DATOS: Mapea la respuesta del GET al formulario
  // ==============================================================
  useEffect(() => {
    if (productToEdit) {
      // 1. Formatear la fecha (cortamos el T00:00:00)
      let formattedDate = '';
      if (productToEdit.nextExpirationDate) {
        formattedDate = productToEdit.nextExpirationDate.split('T')[0];
      }

      // 2. Extraer el padre (índice 0) y los hijos (índice 1 en adelante)
      const basePres = productToEdit.presentations?.length > 0 ? productToEdit.presentations[0] : null;
      const childPresentations = productToEdit.presentations?.length > 1 ? productToEdit.presentations.slice(1) : [];

      // 3. Cargar el estado
      setBaseProduct({
        id: productToEdit.id,
        internalCode: productToEdit.internalCode || '',
        barcode: productToEdit.barcode || '',
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        brand: productToEdit.brand || '',
        location: productToEdit.location || '',
        supplierId: productToEdit.supplierId || 0,
        supplierPrice: productToEdit.supplierPrice || "",
        profitMargin: productToEdit.profitMargin || "",
        baseSalePrice: basePres ? basePres.price : "",
        baseStockFactor: basePres ? basePres.stockFactor : "1",
        basePresentationId: basePres ? basePres.id : null,
        unitOfMeasure: productToEdit.unitOfMeasure || 'PZA',
        isInventoryTracked: productToEdit.isInventoryTracked,
        initialStock: productToEdit.currentStock || "", // Mostramos el actual, pero el backend lo ignorará al guardar
        hasExpiration: productToEdit.hasExpiration,
        nextExpirationDate: formattedDate
      });

      // Mapeamos a los hijos guardando sus IDs
      setPresentations(childPresentations.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        barcode: p.barcode || '',
        price: p.price,
        stockFactor: p.stockFactor
      })));
    } else {
      setBaseProduct(initialBaseProduct);
      setPresentations([]);
    }
    setStep(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit]);

  useEffect(() => {
    const loadSuppliers = async () => {
      if (!user?.token) return;
      setIsLoadingSuppliers(true);
      const res = await supplierService.getSuppliers(user.token, 1, 100, true);
      if (res && res.success) {
        setSuppliers(res.data.data);
        if (!productToEdit && res.data.data.length > 0) {
          setBaseProduct((prev: any) => ({ ...prev, supplierId: res.data.data[0].id }));
        }
      }
      setIsLoadingSuppliers(false);
    };
    loadSuppliers();
  }, [user?.token, productToEdit]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
    if (baseProduct.hasExpiration && baseProduct.nextExpirationDate.length !== 10) {
      showNotification("La fecha de caducidad debe tener el formato completo AAAA-MM-DD.");
      return;
    }

    // Armamos la presentación Padre (añadiendo ID si es edición)
    const basePresentation = {
      id: baseProduct.basePresentationId || 0,
      name: baseProduct.name || "Presentación Base",
      code: baseProduct.internalCode || "BASE",
      barcode: baseProduct.barcode || "",
      price: Number(baseProduct.baseSalePrice || 0),
      stockFactor: Number(baseProduct.baseStockFactor || 1)
    };

    // Armamos a los hijos asegurando que tengan un ID (0 si son nuevos en la edición)
    const formattedChildren = presentations.map(p => ({
      id: p.id || 0,
      name: p.name,
      code: p.code,
      barcode: p.barcode || "",
      price: Number(p.price),
      stockFactor: Number(p.stockFactor)
    }));

    const finalPresentations = [basePresentation, ...formattedChildren];

    // Payload dinámico (CreateProductDto vs UpdateProductDto)
    const payload: any = {
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
      hasExpiration: baseProduct.hasExpiration,
      nextExpirationDate: baseProduct.hasExpiration && baseProduct.nextExpirationDate.length === 10
        ? new Date(baseProduct.nextExpirationDate).toISOString() 
        : null,
      presentations: finalPresentations
    };

    // Si NO estamos editando, agregamos el InitialStock al DTO
    if (!isEditing) {
      payload.initialStock = baseProduct.isInventoryTracked ? Number(baseProduct.initialStock || 0) : 0;
    }
    
    await onSave(payload, isEditing);
  };

  const selectedSupplierName = suppliers.find(s => s.id === Number(baseProduct.supplierId))?.name || 'Desconocido';

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative">
      
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

      {/* CABECERA DINÁMICA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-gray-800 pb-6 flex-shrink-0 gap-4 bg-[#161616] z-20">
        <div>
          <h2 className="text-3xl font-extrabold text-white">
            {isEditing ? 'Edición de Producto' : 'Alta de Nuevo Producto'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {step === 1 && "Paso 1: Identificación y datos generales del artículo."}
            {step === 2 && "Paso 2: Proveedor, costos, inventario y variantes de venta."}
            {step === 3 && "Paso 3: Verificación jerárquica y confirmación en base de datos."}
          </p>
        </div>
        
        {/* FIX: antes el paso a paso (span's) vivía solo; onCancel nunca llegaba
            a los pasos 2 y 3, así que una vez que avanzabas no había forma de
            cerrar el formulario completo y volver al catálogo (Vista 1 con
            Activos/Inactivos). Este botón está fuera del "if (step === X)" así
            que se ve SIEMPRE, sin importar el paso, y dispara el mismo onCancel
            que ya usa el Paso 1. */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2 bg-black/50 p-2 rounded-2xl border border-gray-800">
            <span className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${step === 1 ? 'bg-brand-orange text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>1. Identificación</span>
            <span className="text-gray-600 font-bold">→</span>
            <span className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${step === 2 ? 'bg-brand-orange text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>2. Costos y Variantes</span>
            <span className="text-gray-600 font-bold">→</span>
            <span className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${step === 3 ? 'bg-brand-orange text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}>3. Resumen</span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            title="Cancelar y volver al catálogo"
            className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-bold text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold flex-shrink-0">
          {error}
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 flex flex-col relative">
        
        {step === 1 && (
          <div style={{ animation: 'fadeInSlide 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }} className="w-full flex-1 flex flex-col min-h-full">
            <ProductStepBase baseProduct={baseProduct} setBaseProduct={setBaseProduct} onCancel={onCancel} onNext={handleNextToStep2} />
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeInSlide 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }} className="w-full flex-1 flex flex-col min-h-full">
            <ProductStepPresentations baseProduct={baseProduct} setBaseProduct={setBaseProduct} suppliers={suppliers} isLoadingSuppliers={isLoadingSuppliers} presentations={presentations} setPresentations={setPresentations} onBackToBase={() => setStep(1)} onFinishToSummary={() => setStep(3)} showNotification={showNotification} />
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeInSlide 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }} className="w-full flex-1 flex flex-col min-h-full">
            <ProductStepSummary 
              baseProduct={baseProduct} presentations={presentations} supplierName={selectedSupplierName} 
              onBackToEdit={() => setStep(2)} onConfirmSave={handleFinalSubmit} 
              onDeactivate={onDeactivate} 
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