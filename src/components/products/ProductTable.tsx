// src/components/products/ProductTable.tsx
import React from 'react';
import { Product } from '../../types/product';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onEdit: (product: Product) => void;
  searchTerm: string;      // NUEVO
  onClearSearch: () => void; // NUEVO
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onRetry,
  onEdit,
  searchTerm,
  onClearSearch
}) => {
  return (
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
            
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg className="animate-spin h-12 w-12 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-400 text-lg font-bold tracking-widest animate-pulse uppercase">Cargando Inventario...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-white text-xl font-bold">{error}</p>
                    <button onClick={onRetry} className="mt-4 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold">
                      Volver a intentar
                    </button>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                   <span className="text-gray-500 text-lg font-medium">No se encontraron productos.</span>
                   {searchTerm && (
                      <p className="text-brand-orange mt-2 text-base cursor-pointer hover:underline" onClick={onClearSearch}>
                        Limpiar búsqueda
                      </p>
                   )}
                </td>
              </tr>
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
                    <button 
                      onClick={() => onEdit(product)}
                      className="text-brand-orange font-bold text-base hover:text-white transition-colors bg-brand-orange/10 px-4 py-2 rounded-lg hover:bg-brand-orange/20"
                    >
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
            onClick={() => onPageChange(currentPage - 1)}
            className="px-4 py-2.5 rounded-lg border border-gray-700 font-bold text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            Anterior
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0 || isLoading || error !== null}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-4 py-2.5 rounded-lg border border-gray-700 font-bold text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;