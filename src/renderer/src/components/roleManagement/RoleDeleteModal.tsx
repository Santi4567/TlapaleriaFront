// src/components/roleManagement/RoleDeleteModal.tsx
import React from 'react';

interface RoleDeleteModalProps {
  isOpen: boolean;
  roleName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const RoleDeleteModal: React.FC<RoleDeleteModalProps> = ({ isOpen, roleName, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-red-900/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(239,68,68,0.15)] transform transition-all scale-100">
        
        <div className="mx-auto w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">¿Eliminar Rol?</h3>
        <p className="text-gray-400 mb-6 text-sm">
          Estás a punto de eliminar el rol <strong className="text-white">"{roleName}"</strong>. Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-colors">
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleDeleteModal;