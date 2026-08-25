// src/components/roleManagement/RoleConfirmModal.tsx
import React from 'react';

interface RoleConfirmModalProps {
  isOpen: boolean;
  roleName: string;
  permsCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const RoleConfirmModal: React.FC<RoleConfirmModalProps> = ({ isOpen, roleName, permsCount, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
        
        <div className="mx-auto w-16 h-16 bg-brand-orange/20 text-brand-orange rounded-full flex items-center justify-center mb-6">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Confirmar Registro</h3>
        <p className="text-gray-400 mb-6 text-sm">
          ¿Estás seguro de crear el rol <strong className="text-white">"{roleName}"</strong> con <strong className="text-brand-orange">{permsCount} permisos</strong> asignados?
        </p>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium">
            Revisar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-brand-orange hover:bg-orange-600 text-black font-bold rounded-xl shadow-lg transition-colors">
            Sí, Crear Rol
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleConfirmModal;