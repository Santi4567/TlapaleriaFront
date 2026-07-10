// src/components/suppliers/SupplierModal.tsx
import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types/supplier';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: { name: string; contactName: string; phone: string; isActive: boolean }) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  supplierToEdit?: Supplier | null; // NUEVO: Proveedor a editar (si existe)
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSave, isSubmitting, error, supplierToEdit }) => {
  const [formData, setFormData] = useState({ name: '', contactName: '', phone: '', isActive: true });

  // Cuando se abre el modal, verificamos si es CREAR o EDITAR
  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        // Modo Edición: Cargamos los datos del proveedor
        setFormData({
          name: supplierToEdit.name,
          contactName: supplierToEdit.contactName || '',
          phone: supplierToEdit.phone || '',
          isActive: supplierToEdit.isActive
        });
      } else {
        // Modo Creación: Limpiamos todo
        setFormData({ name: '', contactName: '', phone: '', isActive: true });
      }
    }
  }, [isOpen, supplierToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!supplierToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* MODAL MÁS GRANDE: max-w-2xl y padding p-10 */}
      <div className="bg-[#161616] border-2 border-gray-800 rounded-[2rem] p-10 w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-5">
          <div>
            <h3 className="text-3xl font-black text-white">
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            <p className="text-gray-400 mt-2 text-lg">
              {isEditing ? `Actualizando datos del proveedor #${supplierToEdit.id}` : 'Registra un nuevo distribuidor en el sistema.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-gray-900 hover:bg-gray-800 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-base font-bold flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-300 font-bold mb-2 text-lg">Nombre de la Empresa <span className="text-brand-orange">*</span></label>
              <input 
                type="text" autoFocus placeholder="Ej. Truper" value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white text-xl rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 font-bold mb-2 text-lg">Contacto Principal <span className="text-brand-orange">*</span></label>
              <input 
                type="text" placeholder="Ej. Carlos N" value={formData.contactName}
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white text-xl rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-2 text-lg">Teléfono <span className="text-brand-orange">*</span></label>
              <input 
                type="text" placeholder="Ej. 2223334445" value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white text-xl rounded-2xl px-5 py-4 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/50 transition-all placeholder-gray-600"
              />
            </div>
          </div>

          {/* Si estamos editando, mostramos la opción para desactivarlo */}
          {isEditing && (
            <div className="flex items-center justify-between p-5 mt-4 bg-gray-900/50 border border-gray-800 rounded-2xl">
              <div>
                <h4 className="text-white font-bold text-lg">Estado del Proveedor</h4>
                <p className="text-sm text-gray-400">Si lo desactivas, no aparecerá para nuevas compras.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          <div className="pt-8 flex space-x-4 border-t border-gray-800 mt-8">
            <button 
              type="button" onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-700 text-gray-300 font-bold text-xl hover:bg-gray-800 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={isSubmitting}
              className="flex-1 px-6 py-4 rounded-2xl bg-brand-orange text-black font-black text-xl hover:bg-orange-600 transition-colors shadow-[0_0_20px_rgba(255,90,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-7 w-7 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (isEditing ? 'Guardar Cambios' : 'Registrar Proveedor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;