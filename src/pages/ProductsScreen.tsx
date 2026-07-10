// src/pages/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';

const ProductsScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  
  // NUEVO: Estados para manejar la carga y los errores
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  const fetchProducts = async () => {
    if (!user?.token) return;
    
    // Reiniciamos los estados antes de pedir los datos
    setIsLoading(true);
    setError(null); 
    
    const response = await productService.getProducts(user.token, currentPage, pageSize, isActiveFilter);
    
    if (response && response.success) {
      setProducts(response.data.data);
      setTotalPages(response.data.totalPages);
    } else {
      // Si la API falla o devuelve error, activamos este mensaje
      setError("No se pudo conectar con el servidor para cargar el catálogo.");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, isActiveFilter, user?.token]);

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

      {/* TABLA DE PRODUCTOS */}
      <div className="flex-1 overflow-hidden border border-gray-800 rounded-2xl bg-[#1a1a1a] flex flex-col relative">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          
          <table className="w-full min-w-[1200px] text-left text-base text-brand-text">
            <thead className="bg-[#121212] text-brand-text-muted sticky top-0 z-10 shadow-md">
              <tr>
                <th className="px-6 py-5 font-bold text-lg w-[150px]">SKU / Código</th>
                <th className="px-6 py-5 font-bold text-lg w-[350px]">Producto</th>
                <th className="px-6 py-5 font-bold text-lg w-[150px]">Marca</th>
                <th className="px-6 py-5 font-bold text-lg w-[150px]">Stock Base</th>
                <th className="px-6 py-5 font-bold text-lg">Presentaciones (Venta)</th>
                <th className="px-6 py-5 font-bold text-lg text-center w-[120px] sticky right-0 bg-[#121212]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              
              {/* ESTADO 1: CARGANDO */}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {/* Animación SVG tipo Spinner */}
                      <svg className="animate-spin h-12 w-12 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-400 text-lg font-bold tracking-widest animate-pulse uppercase">Cargando Inventario...</span>
                    </div>
                  </td>
                </tr>

              // ESTADO 2: ERROR DE RED
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                         </svg>
                      </div>
                      <p className="text-white text-xl font-bold">{error}</p>
                      
                      {/* Botón de reintento */}
                      <button
                        onClick={fetchProducts}
                        className="mt-4 flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Volver a intentar
                      </button>
                    </div>
                  </td>
                </tr>

              // ESTADO 3: SIN PRODUCTOS
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                     <span className="text-gray-500 text-lg font-medium">No se encontraron productos en esta categoría.</span>
                  </td>
                </tr>

              // ESTADO 4: MOSTRAR DATOS
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap font-mono font-bold text-brand-orange text-lg">
                      {product.internalCode}
                    </td>
                    
                    <td className="px-6 py-5">
                      <div className="max-w-[320px]">
                        <p className="font-extrabold text-white text-lg truncate cursor-help" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 truncate" title={product.location}>
                          {product.location}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 font-medium text-lg truncate max-w-[150px]" title={product.brand}>
                      {product.brand}
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      {!product.isInventoryTracked ? (
                        <span className="font-black text-gray-500 text-xl cursor-help" title="No Stockeable (Sin seguimiento de inventario)">
                          N/S
                        </span>
                      ) : (
                        <>
                          <span className={`font-black text-xl ${product.currentStock === 0 && product.isActive ? 'text-red-500' : 'text-white'}`}>
                            {product.currentStock}
                          </span> 
                          <span className="text-base text-gray-400 ml-1">{product.unitOfMeasure}</span>
                        </>
                      )}
                    </td>
                    
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2.5">
                        {product.presentations.map(pres => (
                          <span key={pres.id} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-black border border-gray-600 text-gray-200 shadow-sm">
                            {pres.name} - <span className="text-brand-orange ml-1">${pres.price}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    
                    <td className="px-6 py-5 text-center sticky right-0 bg-[#1a1a1a] group-hover:bg-[#1f1f1f] transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.2)] border-l border-gray-800">
                      <button className="text-brand-orange font-bold text-base hover:text-white transition-colors bg-brand-orange/10 px-4 py-2 rounded-lg hover:bg-brand-orange/20">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN INFERIOR */}
        <div className="bg-[#121212] px-6 py-5 border-t border-gray-800 flex items-center justify-between flex-shrink-0 relative z-20">
          <span className="text-base text-gray-400">
            Página <span className="font-bold text-white text-lg mx-1">{currentPage}</span> de <span className="font-bold text-white text-lg mx-1">{totalPages}</span>
          </span>
          <div className="flex space-x-3">
            <button 
              disabled={currentPage === 1 || isLoading || error !== null}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2.5 rounded-lg border border-gray-700 font-bold text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0 || isLoading || error !== null}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2.5 rounded-lg border border-gray-700 font-bold text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductsScreen;