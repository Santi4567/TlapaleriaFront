// src/pages/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import ProductTable from '../components/products/ProductTable';
import ProductCreateForm from '../components/products/ProductCreateForm';
import ProductReactivateView from '../components/products/ProductReactivateView'; // <-- AGREGA ESTE IMPORT


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

  // ESTADOS DEL FORMULARIO Y EDICIÓN
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [reactivatingProduct, setReactivatingProduct] = useState<any | null>(null);


  const fetchProducts = async (term: string = '', activeState: boolean = isActiveFilter) => {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null); 
    
    if (term.trim() !== '') {
      const response = await productService.searchProducts(user.token, term, activeState);
      if (response && response.success) {
        setProducts(response.data);
        setTotalPages(1); 
      } else {
        setError("No se pudo conectar con el servidor para buscar productos.");
      }
    } else {
      const response = await productService.getProducts(user.token, currentPage, pageSize, activeState);
      if (response && response.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        setError("No se pudo conectar con el servidor para cargar el catálogo.");
      }
    }
    setIsLoading(false);
  };

  // EFECTO 1: Para búsqueda con temporizador (solo al teclear)
  useEffect(() => {
    if (!user?.token) return;
    const delaySearch = setTimeout(() => {
      fetchProducts(searchTerm, isActiveFilter);
    }, 400);
    return () => clearTimeout(delaySearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // EFECTO 2: Para cambio inmediato al cambiar de pestaña o página (sin retardo)
  useEffect(() => {
    if (!user?.token) return;
    fetchProducts(searchTerm, isActiveFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isActiveFilter, user?.token]);

  // CORRECCIÓN CLAVE: Le pasamos isActiveFilter como 3er parámetro a getProductById
  const handleEditClick = async (product: Product) => {
    if (!user?.token) return;
    const response = await productService.getProductById(user.token, product.id, isActiveFilter);
    if (response && response.success) {
      if (!isActiveFilter) {
        // Camino inactivo: Abre la nueva vista de restauración
        setReactivatingProduct(response.data);
        setIsReactivateOpen(true);
      } else {
        // Camino activo: Abre el formulario de edición normal
        setEditingProduct(response.data);
        setIsFormOpen(true);
      }
    } else {
      setSuccessMessage(null);
      setError("No se pudo cargar la información del producto.");
    }
  };

  //Función para ejecutar el borrado lógico (desactivar)
  const handleDeactivateProduct = async () => {
    if (!user?.token || !editingProduct) return;
    setIsSubmitting(true);
    const res = await productService.deleteProduct(user.token, editingProduct.id);
    setIsSubmitting(false);

    if (res && res.success) {
      handleCloseAllOverlays();
      setSuccessMessage(`El producto "${editingProduct.name}" ha sido movido a Inactivos.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchProducts(searchTerm, isActiveFilter);
    } else {
      setFormError(res?.message || "No se pudo desactivar el producto.");
    }
  };

  // Si le dan "Sí, Editar" tras restaurar un inactivo
  const handleReactivatedAndEdit = (product: any) => {
    setIsReactivateOpen(false);
    setReactivatingProduct(null);
    setIsActiveFilter(true); // Cambiamos la pestaña a Activos automáticamente
    setEditingProduct(product);
    setIsFormOpen(true); // Abrimos el formulario para editar
  };

  const handleOpenCreateForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // FIX: Antes solo cerraba el formulario normal (isFormOpen) y nunca
  // reseteaba la vista de reactivación (isReactivateOpen). Si esa vista
  // quedaba abierta, se quedaba flotando por encima de la tabla incluso
  // al cambiar de pestaña, tapando los resultados de "Inactivos".
  // Ahora esta única función limpia AMBOS overlays a la vez.
  const handleCloseAllOverlays = () => {
    // Formulario normal (crear/editar)
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormError(null);
    setIsSubmitting(false);
    // Vista de reactivación (esto era lo que faltaba)
    setIsReactivateOpen(false);
    setReactivatingProduct(null);
  };

  const handleSaveProduct = async (productData: any, isEditing: boolean) => {
    if (!user?.token) return;
    setIsSubmitting(true);
    setFormError(null);

    let res;
    if (isEditing && editingProduct) {
      res = await productService.updateProduct(user.token, editingProduct.id, productData);
    } else {
      res = await productService.createProduct(user.token, productData);
    }
    
    if (res && res.success) {
      handleCloseAllOverlays();
      setSuccessMessage(`¡Producto "${productData.name}" ${isEditing ? 'actualizado' : 'guardado'} exitosamente!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchProducts(searchTerm, isActiveFilter);
    } else {
      setFormError(res?.message || "Ocurrió un error al procesar el producto en el servidor.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden">
      
      {/* BANNER VERDE DE ÉXITO () Genra un bug vizual ocultando la tabla de inactivos
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 font-extrabold text-lg flex items-center justify-between z-30 animate-in fade-in slide-in-from-top duration-300 flex-shrink-0">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 mr-3 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-white">✕</button>
        </div>
      )} */}

      {/* CONTENEDOR MAESTRO */}
      <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
        
        {/* VISTA 1: CATÁLOGO Y TABLA */}
        <div 
          style={(isFormOpen || isReactivateOpen) ? {
            transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateX(-20%)',
            opacity: 0,
            pointerEvents: 'none'
          } : undefined}
          className="w-full h-full flex flex-col flex-1 transition-opacity duration-300"
        >
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 flex-shrink-0 gap-4">
            <div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">Catálogo de Productos</h2>
              <p className="text-brand-text-muted text-lg mt-1">Gestiona el inventario base y sus presentaciones.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800">
                <button 
                  onClick={() => { handleCloseAllOverlays(); setIsActiveFilter(true); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all ${isActiveFilter ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Activos
                </button>
                <button 
                  onClick={() => { handleCloseAllOverlays(); setIsActiveFilter(false); setCurrentPage(1); }}
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
              </div>

              <button 
                onClick={handleOpenCreateForm}
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
            onRetry={() => fetchProducts(searchTerm, isActiveFilter)}
            onEdit={handleEditClick}
            searchTerm={searchTerm}
            onClearSearch={() => { setSearchTerm(''); setCurrentPage(1); }}
          />
        </div>

        
        {/* VISTA 2: FORMULARIO MULTIUSO (CREAR / EDITAR) */}
        {isFormOpen && (
          <div 
            style={{ animation: 'slideInFromRight 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
            className="absolute inset-0 w-full h-full flex flex-col z-20 bg-[#161616]"
          >
            <ProductCreateForm 
              productToEdit={editingProduct}
              onCancel={handleCloseAllOverlays}
              onSave={handleSaveProduct}
              onDeactivate={handleDeactivateProduct} 
              isSubmitting={isSubmitting}
              error={formError}
            />
          </div>
        )}

        {/* VISTA 3: VISTA DE REACTIVACIÓN PARA PRODUCTOS INACTIVOS */}
        {isReactivateOpen && (
          <div 
            style={{ animation: 'slideInFromRight 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
            className="absolute inset-0 w-full h-full flex flex-col z-20 bg-[#161616]"
          >
            <ProductReactivateView 
              product={reactivatingProduct}
              onClose={() => { handleCloseAllOverlays(); fetchProducts(searchTerm, isActiveFilter); }}
              onReactivatedAndEdit={handleReactivatedAndEdit}
            />
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0%); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default ProductsScreen;