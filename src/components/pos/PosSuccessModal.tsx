// src/components/pos/PosSuccessModal.tsx
import React, { useEffect } from 'react';

interface PosSuccessModalProps {
  saleData: any; 
  onFinish: () => void;
}

const PosSuccessModal: React.FC<PosSuccessModalProps> = ({
  saleData,
  onFinish
}) => {
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

  if (!saleData) return null;

  const dateObj = new Date(saleData.createdAt);
  const dateStr = dateObj.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const methodText = saleData.paymentMethod === 'Efectivo' ? 'Efectivo 💵' 
                   : saleData.paymentMethod === 'Transferencia' ? 'Transferencia SPEI 🏦' 
                   : 'Tarjeta TPV 💳';

  // Si fue en efectivo, el backend recibe el monto en paymentReference. Lo convertimos a número.
  const isCash = saleData.paymentMethod === 'Efectivo';
  const amountReceived = isCash && saleData.paymentReference ? parseFloat(saleData.paymentReference) : null;
  const changeToReturn = amountReceived ? Math.max(0, amountReceived - saleData.totalAmount) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in zoom-in-95 duration-200">
      {/* CONTENEDOR MÁS GRANDE (max-w-2xl) Y CON MÁS PADDING (p-10) */}
      <div className="max-w-2xl w-full bg-[#121212] rounded-[2rem] border-2 border-green-500/60 p-10 shadow-[0_0_80px_rgba(34,197,94,0.3)] text-center space-y-8">
        
        <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-5xl font-black border-2 border-green-500/40 shadow-inner">
          ✓
        </div>

        <div>
          <h3 className="text-4xl font-black text-white tracking-tight">¡Venta Exitosa!</h3>
          <p className="text-sm text-green-400 font-mono mt-2 uppercase font-black tracking-widest">El inventario se ha actualizado</p>
        </div>

        {/* DETALLES CON TIPOGRAFÍA MÁS GRANDE */}
        <div className="bg-black/60 p-6 rounded-3xl border border-gray-800 font-mono text-base space-y-4 text-left shadow-inner">
          <div className="flex justify-between border-b border-gray-800/80 pb-3">
            <span className="text-gray-500">Folio / ID Venta:</span>
            <strong className="text-brand-orange font-black text-lg">{saleData.folio}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Fecha y Hora:</span>
            <span className="text-gray-200 font-bold">{dateStr} {timeStr}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Método de Pago:</span>
            <span className="text-gray-200 font-bold">{methodText}</span>
          </div>
          
          {/* Si fue transferencia o tarjeta y mandaste una referencia, la mostramos */}
          {!isCash && saleData.paymentReference && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Referencia/Voucher:</span>
              <span className="text-gray-200 font-bold">{saleData.paymentReference}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Cajero:</span>
            <span className="text-gray-200 font-bold">{saleData.user?.name || 'Desconocido'}</span>
          </div>
          
          {/* DESGLOSE DE EFECTIVO SI APLICA */}
          {isCash && amountReceived !== null && (
            <div className="pt-2 border-t border-gray-800/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Efectivo Recibido:</span>
                <span className="text-gray-300 font-bold">${amountReceived.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-brand-orange">
                <span className="font-bold">Cambio Devuelto:</span>
                <span className="font-black text-xl">${changeToReturn?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* TOTAL EN GRANDE */}
          <div className="flex justify-between border-t-2 border-gray-800 pt-4 mt-2 items-baseline bg-green-500/5 p-4 rounded-xl">
            <span className="text-gray-400 font-sans font-black uppercase tracking-wider text-lg">Total Pagado:</span>
            <strong className="text-green-400 font-black text-4xl drop-shadow-md">
              ${saleData.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* BOTÓN MÁS GRANDE Y CÓMODO */}
        <button
          type="button"
          autoFocus
          onClick={onFinish}
          className="w-full py-5 bg-green-500 hover:bg-green-400 text-black font-black text-xl rounded-2xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center space-x-3 border border-green-400"
        >
          <span>✓ Continuar / Siguiente Venta</span>
          <kbd className="bg-black/40 text-black px-3 py-1 rounded-lg font-mono text-sm shadow-inner">Enter ↵</kbd>
        </button>

      </div>
    </div>
  );
};

export default PosSuccessModal;