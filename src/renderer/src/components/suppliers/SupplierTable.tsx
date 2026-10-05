// src/components/suppliers/SupplierTable.tsx
import React from 'react';
import { Supplier } from '../../types/supplier';

interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  isActiveFilter: boolean;
  searchTerm: string;
  currentPage: number; // NUEVO
  totalPages: number;  // NUEVO
  onPageChange: (newPage: number) => void; // NUEVO
  onRetry: () => void;
  onClearSearch: () => void;
  onEdit: (supplier: Supplier) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({ 
  suppliers, 
  isLoading, 
  error, 
  isActiveFilter, 
  searchTerm, 
  currentPage,
  totalPages,
  onPageChange,
  onRetry, 
  onClearSearch,
  onEdit 
}) => {
  return (
    <div className="flex-1 overflow-hidden border border-gray-800 rounded-2xl bg-[#1a1a1a] flex flex-col relative">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full min-w-[900px] text-left text-base text-brand-text">
          <thead className="bg-[#121212] text-brand-text-muted sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-6 py-5 font-bold text-lg w-[80px]">ID</th>
              <th className="px-6 py-5 font-bold text-lg w-[300px]">Empresa</th>
              <th className="px-6 py-5 font-bold text-lg w-[250px]">Contacto</th>
              <th className="px-6 py-5 font-bold text-lg w-[150px]">Estado</th>
              <th className="px-6 py-5 font-bold text-lg text-center w-[120px] sticky right-0 bg-[#121212]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg className="animate-spin h-12 w-12 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-400 text-lg font-bold tracking-widest animate-pulse uppercase">Cargando Proveedores...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-white text-xl font-bold">{error}</p>
                    <button onClick={onRetry} className="mt-4 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold">
                      Volver a intentar
                    </button>
                  </div>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                   <span className="text-gray-500 text-lg font-medium">No se encontraron proveedores {isActiveFilter ? 'activos' : 'inactivos'}.</span>
                   {searchTerm && (
                      <p className="text-brand-orange mt-2 text-base cursor-pointer hover:underline" onClick={onClearSearch}>Limpiar búsqueda</p>
                   )}
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap font-mono font-bold text-gray-500 text-lg">#{supplier.id}</td>
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-white text-xl truncate max-w-[280px]">{supplier.name}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-300 text-lg">{supplier.contactName || 'No especificado'}</p>
                    <span className="text-base font-mono text-gray-400">{supplier.phone || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-5">
                    {supplier.isActive ? (
                      <span className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full">Activo</span>
                    ) : (
                      <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full">Inactivo</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center sticky right-0 bg-[#1a1a1a] border-l border-gray-800 group-hover:bg-[#1f1f1f] transition-colors">
                    <button 
                      onClick={() => onEdit(supplier)} 
                      className="text-brand-orange font-bold px-4 py-2 bg-brand-orange/10 rounded-lg hover:bg-brand-orange/20"
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

      {/* NUEVO: PAGINACIÓN INFERIOR */}
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

export default SupplierTable;