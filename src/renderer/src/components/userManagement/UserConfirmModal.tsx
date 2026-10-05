// src/components/userManagement/UserConfirmModal.tsx
import React from 'react';

interface UserConfirmModalProps {
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const UserConfirmModal: React.FC<UserConfirmModalProps> = ({ isOpen, isEditing, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
        
        {/* Icono de Advertencia */}
        <div className="mx-auto w-16 h-16 bg-brand-orange/20 text-brand-orange rounded-full flex items-center justify-center mb-6">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {isEditing ? '¿Actualizar Usuario?' : '¿Confirmar Registro?'}
        </h3>
        <p className="text-gray-400 mb-8 text-sm">
          Asegúrate de que los datos y los permisos asignados sean correctos antes de continuar.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            Revisar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-brand-orange hover:bg-orange-600 text-black font-bold rounded-xl shadow-lg transition-colors"
          >
            Sí, Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfirmModal;