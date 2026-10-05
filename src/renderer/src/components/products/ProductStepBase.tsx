// src/components/products/ProductStepBase.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';

interface ProductStepBaseProps {
  baseProduct: any;
  setBaseProduct: React.Dispatch<React.SetStateAction<any>>;
  onCancel: () => void;
  onNext: (e: React.FormEvent) => void;
}

const ProductStepBase: React.FC<ProductStepBaseProps> = ({
  baseProduct,
  setBaseProduct,
  onCancel,
  onNext
}) => {
  const { user } = useAuth();

  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeCheckResult, setCodeCheckResult] = useState<{
    existe: boolean;
    nombreProducto: string | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    const checkCode = async () => {
      const currentCode = baseProduct.internalCode.trim();
      
      if (!user?.token || !currentCode) {
        setCodeCheckResult(null);
        return;
      }

      // CORRECCIÓN DE LÓGICA:
      // Si estamos editando (tiene un id) y la clave escrita es igual a la original del producto,
      // la damos como válida sin consultar a la API, porque es su propia clave original.
      if (
        baseProduct.id && 
        baseProduct.originalInternalCode && 
        currentCode.toLowerCase() === baseProduct.originalInternalCode.toLowerCase()
      ) {
        setCodeCheckResult({
          existe: false,
          nombreProducto: null,
          message: "Clave actual del producto"
        });
        return;
      }

      setIsCheckingCode(true);
      const res = await productService.checkInternalCode(user.token, currentCode);
      setIsCheckingCode(false);

      if (res && res.success) {
        setCodeCheckResult({
          existe: res.data.existe,
          nombreProducto: res.data.nombreProducto,
          message: res.message
        });
      } else {
        setCodeCheckResult(null);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkCode();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [baseProduct.internalCode, baseProduct.id, baseProduct.originalInternalCode, user?.token]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeCheckResult && codeCheckResult.existe) {
      return;
    }
    onNext(e);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 max-w-4xl pb-12">
      
      <div className="p-4 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl mb-6">
        <p className="text-sm text-brand-orange font-bold">
          ℹ️ Paso 1: Ingresa únicamente los datos de identificación general del artículo. Los costos, inventario y formas de venta se configuran en el siguiente paso.
        </p>
      </div>

      {/* CÓDIGOS Y MARCA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-gray-300 font-bold mb-2">Código Interno / SKU *</label>
          <div className="relative">
            <input 
              type="text" autoFocus placeholder="Ej. CAB-12-R, CEM-01" 
              value={baseProduct.internalCode}
              onChange={e => {
                setBaseProduct({...baseProduct, internalCode: e.target.value});
                setCodeCheckResult(null);
              }}
              className={`w-full bg-[#121212] border text-white text-lg rounded-xl px-4 py-3 focus:outline-none font-mono transition-colors ${
                codeCheckResult?.existe 
                  ? 'border-red-500 focus:border-red-500 bg-red-500/5' 
                  : codeCheckResult && !codeCheckResult.existe 
                  ? 'border-green-500 focus:border-green-500 bg-green-500/5' 
                  : 'border-gray-700 focus:border-brand-orange'
              }`}
              required
            />
            {isCheckingCode && (
              <div className="absolute right-3 top-3.5">
                <svg className="animate-spin h-5 w-5 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          
          {/* FEEDBACK VISUAL DEL ESTADO DEL CÓDIGO */}
          {codeCheckResult && (
            <div className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center ${
              codeCheckResult.existe ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {codeCheckResult.existe ? '❌ ' : '✓ '}
              {codeCheckResult.message}
              {codeCheckResult.nombreProducto && (
                <span className="ml-1 underline font-extrabold">({codeCheckResult.nombreProducto})</span>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-300 font-bold mb-2">Código de Barras Base</label>
          <input 
            type="text" placeholder="Ej. 75010000002 (Master)" 
            value={baseProduct.barcode}
            onChange={e => setBaseProduct({...baseProduct, barcode: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none font-mono"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Marca</label>
          <input 
            type="text" placeholder="Ej. IUSA, Truper, Cruz Azul" 
            value={baseProduct.brand}
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
            type="text" placeholder="Ej. Cable THW Calibre 12 Rojo, Cemento Gris Tipo CPO" 
            value={baseProduct.name}
            onChange={e => setBaseProduct({...baseProduct, name: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2">Ubicación en Piso / Almacén</label>
          <input 
            type="text" placeholder="Ej. Pasillo 2, Estante C, Tarima A" 
            value={baseProduct.location}
            onChange={e => setBaseProduct({...baseProduct, location: e.target.value})}
            className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
          />
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="block text-gray-300 font-bold mb-2">Descripción Detallada</label>
        <textarea 
          rows={3} placeholder="Ej. Cable de cobre con aislamiento de PVC para uso residencial..." 
          value={baseProduct.description}
          onChange={e => setBaseProduct({...baseProduct, description: e.target.value})}
          className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
        />
      </div>

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
        <button 
          type="button" onClick={onCancel}
          className="px-6 py-4 rounded-xl border border-gray-700 text-gray-400 font-bold hover:bg-gray-800 transition-colors"
        >
          Cancelar y Volver al Catálogo
        </button>
        
        <button 
          type="submit"
          disabled={codeCheckResult?.existe}
          className={`px-8 py-4 rounded-xl font-extrabold transition-colors shadow-lg flex items-center ${
            codeCheckResult?.existe 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50' 
              : 'bg-brand-orange hover:bg-orange-600 text-black'
          }`}
        >
          {codeCheckResult?.existe ? '⚠️ Código Interno en uso' : 'Continuar a Configuración y Variantes →'}
        </button>
      </div>

    </form>
  );
};

export default ProductStepBase;