// src/components/products/ProductCreateForm.tsx
import React, { useState, useEffect } from 'react';
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
  const [isDirectToSummary, setIsDirectToSummary] = useState(false);

  // NUEVO: Agregamos baseSalePrice en el estado inicial
  const [baseProduct, setBaseProduct] = useState<any>({
    internalCode: '',
    barcode: '',
    name: '',
    description: '',
    brand: '',
    location: '',
    supplierId: 0,
    supplierPrice: "",
    profitMargin: "",
    baseSalePrice: "", // <--- AQUÍ ESTÁ EL PRECIO DE VENTA AL PÚBLICO
    unitOfMeasure: 'PZA',
    isInventoryTracked: true,
    initialStock: "",
    hasExpiration: false,
    nextExpirationDate: ''
  });

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

  const handleNextToPresentations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseProduct.name.trim() || !baseProduct.internalCode.trim() || baseProduct.supplierId === 0) {
      alert("Por favor completa al menos el Código Interno, Nombre y Proveedor.");
      return;
    }
    setIsDirectToSummary(false);
    setStep(2);
  };

  const handleDirectToSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseProduct.name.trim() || !baseProduct.internalCode.trim() || baseProduct.supplierId === 0) {
      alert("Por favor completa al menos el Código Interno, Nombre y Proveedor.");
      return;
    }
    // Validamos que hayan puesto un precio de venta al público si es artículo simple
    if (!baseProduct.baseSalePrice || Number(baseProduct.baseSalePrice) <= 0) {
      alert("Por favor ingresa un Precio de Venta al público mayor a 0.");
      return;
    }
    setIsDirectToSummary(true);
    setStep(3);
  };

  const handleBackFromSummary = () => {
    if (isDirectToSummary || presentations.length === 0) {
      setStep(1);
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    // Si no cargaron presentaciones en el paso 2, creamos la obligatoria CON EL PRECIO QUE PUSIERON EN EL INPUT
    const finalPresentations: CreatePresentationRequest[] = presentations.length === 0 ? [{
      name: baseProduct.name || "Presentación Base",
      code: baseProduct.internalCode || "BASE",
      barcode: baseProduct.barcode || "",
      price: Number(baseProduct.baseSalePrice || 0), // <--- YA NO SE CALCULA, TOMA TU INPUT REAL
      stockFactor: 1
    }] : presentations;

    const payload: CreateProductRequest = {
      internalCode: baseProduct.internalCode,
      barcode: baseProduct.barcode,
      name: baseProduct.name,
      description: baseProduct.description,
      brand: baseProduct.brand,
      location: baseProduct.location,
      supplierId: Number(baseProduct.supplierId),
      supplierPrice: Number(baseProduct.supplierPrice || 0),
      profitMargin: Number(baseProduct.profitMargin || 0),
      unitOfMeasure: baseProduct.unitOfMeasure,
      isInventoryTracked: baseProduct.isInventoryTracked,
      initialStock: baseProduct.isInventoryTracked ? Number(baseProduct.initialStock || 0) : 0,
      hasExpiration: baseProduct.hasExpiration,
      nextExpirationDate: baseProduct.hasExpiration && baseProduct.nextExpirationDate 
        ? new Date(baseProduct.nextExpirationDate).toISOString() 
        : null,
      presentations: finalPresentations
    };
    await onSave(payload);
  };

  const selectedSupplierName = suppliers.find(s => s.id === Number(baseProduct.supplierId))?.name || 'Desconocido';

  return (
    <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col">
      
      {/* BARRA DE PROGRESO DE LOS 3 PASOS */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Alta de Nuevo Producto</h2>
          <p className="text-gray-400 mt-1">
            {step === 1 && "Paso 1: Información general, costos y reglas de inventario."}
            {step === 2 && "Paso 2: Captura las variantes de venta (Por metro, rollo, bulto, kilo, etc.)."}
            {step === 3 && "Paso 3: Verificación jerárquica y confirmación de alta."}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <span className={`px-4 py-2 rounded-xl font-bold ${step === 1 ? 'bg-brand-orange text-black' : 'bg-gray-800 text-gray-400'}`}>1. Base</span>
          <span className={`px-4 py-2 rounded-xl font-bold ${step === 2 ? 'bg-brand-orange text-black' : 'bg-gray-800 text-gray-400'}`}>2. Variantes</span>
          <span className={`px-4 py-2 rounded-xl font-bold ${step === 3 ? 'bg-brand-orange text-black' : 'bg-gray-800 text-gray-400'}`}>3. Resumen</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold flex-shrink-0">
          {error}
        </div>
      )}

      {/* CONTENEDOR DE PASOS */}
      <div className="flex-1">
        {step === 1 && (
          <ProductStepBase 
            baseProduct={baseProduct}
            setBaseProduct={setBaseProduct}
            suppliers={suppliers}
            isLoadingSuppliers={isLoadingSuppliers}
            onCancel={onCancel}
            onNextToPresentations={handleNextToPresentations}
            onDirectToSummary={handleDirectToSummary}
          />
        )}

        {step === 2 && (
          <ProductStepPresentations 
            presentations={presentations}
            setPresentations={setPresentations}
            onBackToBase={() => setStep(1)}
            onFinishToSummary={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <ProductStepSummary 
            baseProduct={baseProduct}
            presentations={presentations}
            supplierName={selectedSupplierName}
            onBackToEdit={handleBackFromSummary}
            onConfirmSave={handleFinalSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

    </div>
  );
};

export default ProductCreateForm;