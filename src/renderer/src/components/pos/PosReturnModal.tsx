// src/components/pos/PosReturnModal.tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReturnsWorkspace from '../returns/ReturnsWorkspace';

interface PosReturnModalProps {
  onClose: () => void;
}

const PosReturnModal: React.FC<PosReturnModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl h-[90vh] bg-[#161616] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ReturnsWorkspace isModal onCloseModal={onClose} />
      </div>
    </div>,
    document.body
  );
};

export default PosReturnModal;
