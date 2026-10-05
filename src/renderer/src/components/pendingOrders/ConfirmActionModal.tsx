// src/components/common/ConfirmActionModal.tsx
import React, { useEffect } from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  type: 'success' | 'danger' | 'warning' | 'purple'; 
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); } 
      else if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  // Diccionario de configuración visual según el "type"
  const config = {
    danger: {
      icon: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>,
      iconBg: 'bg-red-500/10 text-red-500 border-red-500/50',
      btn: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
    },
    success: {
      icon: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>,
      iconBg: 'bg-green-500/10 text-green-500 border-green-500/50',
      btn: 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]'
    },
    warning: {
      icon: <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>,
      iconBg: 'bg-orange-500/10 text-orange-500 border-orange-500/50',
      btn: 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
    },
    purple: { // <-- NUEVA CONFIGURACIÓN MORADA
      icon: <svg className="w-10 h-10 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>,
      iconBg: 'bg-purple-500/10 text-purple-500 border-purple-500/50',
      btn: 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
    }
  };

  const activeConfig = config[type];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col items-center p-8 animate-in zoom-in-95 duration-200">
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 mb-6 ${activeConfig.iconBg}`}>
          {activeConfig.icon}
        </div>
        
        <h3 className="text-2xl font-black text-white mb-2 text-center">{title}</h3>
        <div className="text-gray-400 text-center mb-8 text-sm">
          {message}
        </div>

        <div className="flex w-full gap-4">
          <button onClick={onCancel} className="flex-1 bg-[#121212] hover:bg-gray-800 border border-gray-700 text-gray-300 font-bold py-3 px-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-1">
            <span>Cancelar</span>
            <kbd className="bg-black px-1.5 py-0.5 rounded text-[10px] border border-gray-700 text-gray-500">Esc</kbd>
          </button>
          <button onClick={onConfirm} className={`flex-1 font-bold py-3 px-4 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${activeConfig.btn}`}>
            <span>Confirmar</span>
            <kbd className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] border border-transparent text-white/70">Enter</kbd>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmActionModal;