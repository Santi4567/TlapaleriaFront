// src/components/common/ConfirmActionModal.tsx
import React, { useEffect } from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  type: 'success' | 'danger';
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ 
  isOpen, type, title, message, onConfirm, onCancel 
}) => {

  // Escuchar atajos de teclado específicos para este modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border-2 border-gray-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 border ${isSuccess ? 'text-green-400 bg-green-500/10 border-green-500/50' : 'text-red-400 bg-red-500/10 border-red-500/50'}`}>
          {isSuccess ? '✅' : '❌'}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="text-gray-400 text-sm mb-6 leading-relaxed">
          {message}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors flex flex-col items-center justify-center gap-1"
          >
            <span>Cancelar</span>
            <kbd className="text-[10px] bg-black/50 px-2 py-0.5 rounded text-gray-400">Esc</kbd>
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 font-bold rounded-xl transition-colors text-white flex flex-col items-center justify-center gap-1 ${isSuccess ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
          >
            <span>Confirmar</span>
            <kbd className="text-[10px] bg-black/20 px-2 py-0.5 rounded text-white/70">Enter</kbd>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmActionModal;