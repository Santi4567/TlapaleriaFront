// src/components/products/ProductStepBase.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { brandService, Brand } from '../../services/brandService';

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

  const codeInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    codeInputRef.current?.focus({ preventScroll: true });
  }, []);

  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeCheckResult, setCodeCheckResult] = useState<{
    existe: boolean;
    nombreProducto: string | null;
    message: string;
  } | null>(null);

  // ESTADOS PARA AUTOCOMPLETADO DE MARCAS
  const [brandOptions, setBrandOptions] = useState<Brand[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [activeBrandIndex, setActiveBrandIndex] = useState(-1);

  // ESTADOS PARA AUTOCOMPLETADO DE NOMBRES
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [activeNameIndex, setActiveNameIndex] = useState(-1);

  // Efecto para verificar el código interno
  useEffect(() => {
    const checkCode = async () => {
      const currentCode = baseProduct.internalCode.trim();
      
      if (!user?.token || !currentCode) {
        setCodeCheckResult(null);
        return;
      }

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

  // EFECTO PARA BUSCAR MARCAS
  useEffect(() => {
    const fetchBrands = async () => {
      if (!user?.token) return;
      const searchTerm = baseProduct.brand || '';
      
      if (searchTerm.trim() === '') {
        const res = await brandService.getBrands(user.token);
        if (res?.success) setBrandOptions(res.data);
      } else {
        const res = await brandService.searchBrands(user.token, searchTerm);
        if (res?.success) setBrandOptions(res.data);
      }
    };

    const delay = setTimeout(fetchBrands, 300);
    return () => clearTimeout(delay);
  }, [baseProduct.brand, user?.token]);

  // EFECTO PARA SUGERIR NOMBRES
  useEffect(() => {
    const fetchNames = async () => {
      if (!user?.token || !baseProduct.name || baseProduct.name.trim().length < 2) {
        setNameSuggestions([]);
        return;
      }
      const res = await productService.getNameSuggestions(user.token, baseProduct.name);
      if (res?.success) setNameSuggestions(res.data);
    };

    const delay = setTimeout(fetchNames, 300);
    return () => clearTimeout(delay);
  }, [baseProduct.name, user?.token]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeCheckResult && codeCheckResult.existe) {
      return;
    }
    onNext(e);
  };

  // NAVEGACIÓN POR TECLADO PARA MARCAS
  const handleBrandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showBrandSuggestions || brandOptions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveBrandIndex((prev) => (prev < brandOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveBrandIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (activeBrandIndex >= 0 && activeBrandIndex < brandOptions.length) {
        e.preventDefault();
        setBaseProduct({ ...baseProduct, brand: brandOptions[activeBrandIndex].name });
        setShowBrandSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowBrandSuggestions(false);
    }
  };

  // NAVEGACIÓN POR TECLADO PARA NOMBRES
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showNameSuggestions || nameSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveNameIndex((prev) => (prev < nameSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveNameIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (activeNameIndex >= 0 && activeNameIndex < nameSuggestions.length) {
        e.preventDefault();
        setBaseProduct({ ...baseProduct, name: nameSuggestions[activeNameIndex] });
        setShowNameSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowNameSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl pb-12">
      
      {/* COLUMNA IZQUIERDA: CAMPOS DEL FORMULARIO */}
      <div className="flex-1 space-y-6 max-w-4xl">
        
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
                type="text" ref={codeInputRef} placeholder="Ej. CAB-12-R, CEM-01" 
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
          
          {/* INPUT DE MARCA CON AUTOCOMPLETADO */}
          <div className="relative">
            <label className="block text-gray-300 font-bold mb-2">Marca</label>
            <input 
              type="text" placeholder="Ej. IUSA, Truper, 3M" 
              value={baseProduct.brand || ''}
              onChange={e => {
                setBaseProduct({...baseProduct, brand: e.target.value});
                setActiveBrandIndex(-1);
              }}
              onFocus={() => setShowBrandSuggestions(true)}
              onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
              onKeyDown={handleBrandKeyDown}
              className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
            />
            {showBrandSuggestions && brandOptions.length > 0 && (
              <ul className="absolute z-50 w-full bg-[#1a1a1a] border border-gray-700 mt-1 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                {brandOptions.map((brand, index) => (
                  <li 
                    key={brand.id}
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => {
                      setBaseProduct({...baseProduct, brand: brand.name});
                      setShowBrandSuggestions(false);
                    }}
                    className={`px-4 py-3 cursor-pointer font-medium transition-colors ${
                      index === activeBrandIndex 
                        ? 'bg-brand-orange text-black' 
                        : 'text-white hover:bg-brand-orange hover:text-black'
                    }`}
                  >
                    {brand.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* NOMBRE Y UBICACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* INPUT DE NOMBRE CON AUTOCOMPLETADO */}
          <div className="md:col-span-2 relative">
            <label className="block text-gray-300 font-bold mb-2">Nombre Genérico del Artículo *</label>
            <input 
              type="text" placeholder="Ej. Abrazadera Omega" 
              value={baseProduct.name}
              onChange={e => {
                setBaseProduct({...baseProduct, name: e.target.value});
                setActiveNameIndex(-1);
              }}
              onFocus={() => setShowNameSuggestions(true)}
              onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
              onKeyDown={handleNameKeyDown}
              className="w-full bg-[#121212] border border-gray-700 text-white text-lg rounded-xl px-4 py-3 focus:border-brand-orange focus:outline-none"
              required
            />
            {showNameSuggestions && nameSuggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-[#1a1a1a] border border-gray-700 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                {nameSuggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setBaseProduct({...baseProduct, name: suggestion});
                      setShowNameSuggestions(false);
                    }}
                    className={`px-4 py-3 cursor-pointer font-medium transition-colors border-b border-gray-800 last:border-0 ${
                      index === activeNameIndex 
                        ? 'bg-brand-orange text-black' 
                        : 'text-white hover:bg-brand-orange hover:text-black'
                    }`}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
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

      </div>

      {/* COLUMNA DERECHA: BOTONES DE ACCIÓN */}
      <div className="w-full xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-gray-800 xl:pl-8 pt-6 xl:pt-0">
        <div className="sticky top-0 flex flex-col gap-4">
          <p className="hidden xl:block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Acciones</p>
          
          <button 
            type="submit"
            disabled={codeCheckResult?.existe}
            className={`w-full py-4 px-4 rounded-xl font-extrabold transition-colors shadow-lg flex justify-center items-center text-center ${
              codeCheckResult?.existe 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-brand-orange hover:bg-orange-600 text-black'
            }`}
          >
            {codeCheckResult?.existe ? '⚠️ Código en uso' : 'Siguiente Paso →'}
          </button>
          
          <button 
            type="button" onClick={onCancel}
            className="w-full py-4 px-4 rounded-xl border border-gray-700 text-gray-400 font-bold hover:bg-gray-800 transition-colors text-center"
          >
            Cancelar
          </button>
        </div>
      </div>

    </form>
  );
};

export default ProductStepBase;