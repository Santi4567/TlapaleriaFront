// src/pages/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product, CreateProductRequest } from '../types/product';
import ProductTable from '../components/products/ProductTable';
import ProductCreateForm from '../components/products/ProductCreateForm';

const ProductsScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProducts = async (term: string = '') => {
    if (!user?.token) return;
    
    setIsLoading(true);
    setError(null); 
    
    if (term.trim() !== '') {
      const response = await productService.searchProducts(user.token, term, isActiveFilter);
      if (response && response.success) {
        setProducts(response.data);
        setTotalPages(1); 
      } else {
        setError("No se pudo conectar con el servidor para buscar productos.");
      }
    } else {
      const response = await productService.getProducts(user.token, currentPage, pageSize, isActiveFilter);
      if (response && response.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        setError("No se pudo conectar con el servidor para cargar el catálogo.");
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user?.token) return;
    const delaySearch = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [searchTerm, currentPage, isActiveFilter, user?.token]);

  const handleSaveProduct = async (productData: CreateProductRequest) => {
    if (!user?.token) return;
    setIsSubmitting(true);
    setCreateError(null);

    const res = await productService.createProduct(user.token, productData);
    
    if (res && res.success) {
      setIsCreating(false);
      fetchProducts(searchTerm);
    } else {
      setCreateError(res?.message || "Ocurrió un error al registrar el producto en el servidor.");
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (product: Product) => {
    console.log("Abrir modal de edición para:", product.name);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden">
      
      {/* ANIMACIÓN CSS REAL QUE NO DEPENDE DE PLUGINS DE TAILWIND */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        
        {/* VISTA 1: FORMULARIO DE ALTA (Se desliza suave desde la derecha) */}
        <div 
          style={{
            transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isCreating ? 'translateX(0%)' : 'translateX(100%)',
            opacity: isCreating ? 1 : 0,
            pointerEvents: isCreating ? 'auto' : 'none'
          }}
          className="absolute inset-0 w-full h-full flex flex-col z-20 bg-[#161616]"
        >
          <ProductCreateForm 
            onCancel={() => { setIsCreating(false); setCreateError(null); }}
            onSave={handleSaveProduct}
            isSubmitting={isSubmitting}
            error={createError}
          />
        </div>

        {/* VISTA 2: CATÁLOGO Y TABLA (Se empuja hacia la izquierda cuando abres el formulario) */}
        <div 
          style={{
            transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isCreating ? 'translateX(-50%)' : 'translateX(0%)',
            opacity: isCreating ? 0 : 1,
            pointerEvents: isCreating ? 'none' : 'auto'
          }}
          className="absolute inset-0 w-full h-full flex flex-col z-10"
        >
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 flex-shrink-0 gap-4">
            <div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">Catálogo de Productos</h2>
              <p className="text-brand-text-muted text-lg mt-1">Gestiona el inventario base y sus presentaciones.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800">
                <button 
                  onClick={() => { setIsActiveFilter(true); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all ${isActiveFilter ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Activos
                </button>
                <button 
                  onClick={() => { setIsActiveFilter(false); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all ${!isActiveFilter ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Inactivos
                </button>
              </div>

              <div className="relative w-full sm:w-[350px]">
                <input 
                  type="text" 
                  placeholder="Buscar producto, código, marca..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl pl-5 pr-12 py-3 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all placeholder-gray-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
              </div>

              <button 
                onClick={() => setIsCreating(true)}
                className="bg-brand-orange text-black font-bold text-lg px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg flex items-center justify-center whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Nuevo Producto
              </button>
            </div>
          </div>

          <ProductTable 
            products={products}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRetry={() => fetchProducts(searchTerm)}
            onEdit={handleEditClick}
            searchTerm={searchTerm}
            onClearSearch={() => { setSearchTerm(''); setCurrentPage(1); }}
          />
        </div>

      </div>

    </div>
  );
};

export default ProductsScreen;