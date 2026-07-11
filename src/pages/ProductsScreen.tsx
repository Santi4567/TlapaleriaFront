// src/pages/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import ProductTable from '../components/products/ProductTable';

const ProductsScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  const fetchProducts = async () => {
    if (!user?.token) return;
    
    setIsLoading(true);
    setError(null); 
    
    const response = await productService.getProducts(user.token, currentPage, pageSize, isActiveFilter);
    
    if (response && response.success) {
      setProducts(response.data.data);
      setTotalPages(response.data.totalPages);
    } else {
      setError("No se pudo conectar con el servidor para cargar el catálogo.");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, isActiveFilter, user?.token]);

  // Manejador preparado para cuando implementemos el Modal de Edición
  const handleEditClick = (product: Product) => {
    console.log("Abrir modal de edición para:", product.name);
    // Aquí conectaremos setEditingProduct(product) y setIsModalOpen(true)
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col">
      
      {/* CABECERA Y CONTROLES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Catálogo de Productos</h2>
          <p className="text-brand-text-muted text-lg mt-1">Gestiona el inventario base y sus presentaciones.</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
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

          <button className="bg-brand-orange text-black font-bold text-lg px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* NUESTRA TABLA MODULAR */}
      <ProductTable 
        products={products}
        isLoading={isLoading}
        error={error}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRetry={fetchProducts}
        onEdit={handleEditClick}
      />

    </div>
  );
};

export default ProductsScreen;