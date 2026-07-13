// src/pages/SuppliersScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supplierService } from '../services/supplierService';
import { Supplier } from '../types/supplier';
import SupplierModal from '../components/suppliers/SupplierModal';
import SupplierTable from '../components/suppliers/SupplierTable';

const SuppliersScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async (term: string = '') => {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null); 
    
    if (term.trim() !== '') {
      // ACTUALIZADO: Ahora le pasamos isActiveFilter como tercer parámetro al buscador
      const response = await supplierService.searchSuppliers(user.token, term, isActiveFilter);
      if (response && response.success) {
        setSuppliers(response.data);
        setTotalPages(1); 
      } else {
        setError("No se pudo conectar con el servidor para buscar.");
      }
    } else {
      const response = await supplierService.getSuppliers(user.token, currentPage, pageSize, isActiveFilter);
      if (response && response.success) {
        setSuppliers(response.data.data); 
        setTotalPages(response.data.totalPages);
      } else {
        setError("No se pudo conectar con el servidor.");
      }
    }
    
    setIsLoading(false);
  };

  // Nuestro temporizador sigue vigilando searchTerm, currentPage e isActiveFilter
  useEffect(() => {
    if (!user?.token) return;
    const delaySearch = setTimeout(() => {
      fetchSuppliers(searchTerm);
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [searchTerm, currentPage, isActiveFilter, user?.token]);

  const handleSaveSupplier = async (supplierData: { name: string; contactName: string; phone: string; isActive: boolean }) => {
    if (!user?.token) return;
    
    if (!supplierData.name.trim() || !supplierData.contactName.trim() || !supplierData.phone.trim()) {
      setModalError("Los 3 campos (Empresa, Contacto y Teléfono) son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    let response;
    if (editingSupplier) {
      response = await supplierService.updateSupplier(user.token, editingSupplier.id, supplierData);
    } else {
      response = await supplierService.createSupplier(user.token, supplierData);
    }

    if (response && response.success) {
      setIsModalOpen(false);
      setEditingSupplier(null); 
      fetchSuppliers(searchTerm); 
    } else {
      setModalError(response?.message || "Error al procesar la solicitud.");
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative">
      
      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalError(null); setEditingSupplier(null); }}
        onSave={handleSaveSupplier}
        isSubmitting={isSubmitting}
        error={modalError}
        supplierToEdit={editingSupplier} 
      />

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 flex-shrink-0 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-white">Proveedores</h2>
          <p className="text-brand-text-muted text-lg mt-1">Directorio de distribuidores y marcas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800">
            <button 
              onClick={() => { setIsActiveFilter(true); setCurrentPage(1); }} 
              className={`px-5 py-2.5 rounded-lg font-bold ${isActiveFilter ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Activos
            </button>
            <button 
              onClick={() => { setIsActiveFilter(false); setCurrentPage(1); }} 
              className={`px-5 py-2.5 rounded-lg font-bold ${!isActiveFilter ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Inactivos
            </button>
          </div>

          <div className="relative w-full sm:w-[350px]">
            <input 
              type="text" 
              placeholder="Buscar proveedor..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#1a1a1a] border border-gray-700 text-white text-lg rounded-xl pl-5 pr-12 py-3 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all placeholder-gray-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>

          <button onClick={handleNewClick} className="bg-brand-orange text-black font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg flex items-center justify-center whitespace-nowrap">
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      <SupplierTable 
        suppliers={suppliers}
        isLoading={isLoading}
        error={error}
        isActiveFilter={isActiveFilter}
        searchTerm={searchTerm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRetry={() => fetchSuppliers(searchTerm)}
        onClearSearch={() => { setSearchTerm(''); setCurrentPage(1); }}
        onEdit={handleEditClick}
      />
    </div>
  );
};

export default SuppliersScreen;