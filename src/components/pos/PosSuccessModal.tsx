// src/components/pos/PosSuccessModal.tsx
import React, { useEffect } from 'react';
import { PaymentMethod } from '../../types/pos';

interface PosSuccessModalProps {
  saleId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  onFinish: () => void;
}

const PosSuccessModal: React.FC<PosSuccessModalProps> = ({
  saleId,
  totalAmount,
  paymentMethod,
  cashierName,
  onFinish
}) => {
  // Atajo de teclado: Presionar ENTER cierra la pantalla de éxito al instante
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFinish]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const methodText = paymentMethod === 'CASH' ? 'Efectivo 💵' : paymentMethod === 'TRANSFER' ? 'Transferencia SPEI 🏦' : 'Tarjeta TPV 💳';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
      <div className="max-w-md w-full bg-[#121212] rounded-3xl border-2 border-green-500/60 p-8 shadow-[0_0_60px_rgba(34,197,94,0.25)] text-center space-y-6">
        
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-4xl font-black border border-green-500/40 shadow-inner">
          ✓
        </div>

        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">¡Venta Realizada con Éxito!</h3>
          <p className="text-xs text-green-400 font-mono mt-1 uppercase font-bold tracking-widest">El inventario se ha actualizado</p>
        </div>

        {/* DETALLES DEL COMPROBANTE */}
        <div className="bg-black/60 p-5 rounded-2xl border border-gray-800 font-mono text-xs space-y-2.5 text-left">
          <div className="flex justify-between border-b border-gray-800/80 pb-2">
            <span className="text-gray-500">Folio / ID Venta:</span>
            <strong className="text-white font-bold">{saleId}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha y Hora:</span>
            <span className="text-gray-300">{dateStr} {timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Método de Pago:</span>
            <span className="text-gray-300 font-bold">{methodText}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Usuario / Cajero:</span>
            <span className="text-gray-300">{cashierName}</span>
          </div>
          <div className="flex justify-between border-t border-gray-800 pt-2.5 text-base items-baseline">
            <span className="text-gray-400 font-sans font-bold uppercase">Total Pagado:</span>
            <strong className="text-green-400 font-black text-xl">
              ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        <button
          type="button"
          autoFocus
          onClick={onFinish}
          className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_25px_rgba(34,197,94,0.3)] flex items-center justify-center space-x-2"
        >
          <span>✓ Continuar / Siguiente Venta [Enter]</span>
        </button>

      </div>
    </div>
  );
};

export default PosSuccessModal;