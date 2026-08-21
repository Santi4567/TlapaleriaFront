// src/components/StatusAlert.tsx
import React, { useEffect } from 'react';

interface StatusAlertProps {
  success: boolean;
  message: string;
  onClose: () => void;
}

const StatusAlert: React.FC<StatusAlertProps> = ({ success, message, onClose }) => {
  // Autocierre después de 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Colores dinámicos basados en la respuesta de tu API
  const bgColor = success ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = success ? 'border-green-500/50' : 'border-red-500/50';
  const textColor = success ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`flex items-center justify-between p-4 mb-6 border rounded-xl shadow-lg transition-all ${bgColor} ${borderColor} animate-fade-in-down`}>
      <div className="flex items-center gap-3">
        {success ? (
          // Icono de Check (Éxito)
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 ${textColor}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          // Icono de X (Error)
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-6 h-6 ${textColor}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <span className={`font-semibold ${textColor}`}>{message}</span>
      </div>
      
      {/* Botón de cierre manual */}
      <button onClick={onClose} className={`${textColor} hover:opacity-70 transition-opacity`}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default StatusAlert;