// src/components/pos/PosPaymentModal.tsx
import React, { useState } from 'react';
import { PaymentMethod } from '../../types/pos';

interface PosPaymentModalProps {
  method: PaymentMethod;
  totalAmount: number;
  clientName: string;
  onClose: () => void;
  onConfirmPayment: (referenceCode: string) => void;
}

const PosPaymentModal: React.FC<PosPaymentModalProps> = ({
  method,
  totalAmount,
  clientName,
  onClose,
  onConfirmPayment
}) => {
  const [reference, setReference] = useState('');
  const isTransfer = method === 'TRANSFER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reference.trim().length > 0) {
      onConfirmPayment(reference.trim());
    }
  };

  return (
    // CONTENEDOR GLOBAL CON DESENFOQUE PROFUNDO
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-8 shadow-[0_0_50px_rgba(255,90,0,0.25)] relative">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{isTransfer ? '🏦' : '💳'}</span>
            <div>
              <h3 className="text-2xl font-black text-white">
                {isTransfer ? 'Pago por Transferencia' : 'Pago con Tarjeta'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">Cliente: {clientName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 block uppercase font-bold">Total a Cobrar</span>
            <span className="text-2xl font-black font-mono text-brand-orange">
              ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* SUBMENÚ / INSTRUCCIONES DE TRANSFERENCIA */}
        {isTransfer && (
          <div className="bg-black/60 p-5 rounded-2xl border border-gray-800 mb-6 space-y-3">
            <p className="text-xs font-bold text-brand-orange uppercase tracking-wider flex items-center">
              <span className="mr-1.5">ℹ️</span> Instrucciones para el cliente
            </p>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              Bienvenido a la transferencia. Por favor capture con precaución los datos para la referencia de pago:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs bg-[#1a1a1a] p-3.5 rounded-xl border border-gray-700/60">
              <div>
                <span className="text-gray-500 block">Titular / Beneficiario:</span>
                <strong className="text-white font-bold text-sm">Tlapalería LEO S.A.</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Banco:</span>
                <strong className="text-white font-bold text-sm">BBVA México</strong>
              </div>
              <div className="sm:col-span-2 border-t border-gray-800 pt-2 mt-1">
                <span className="text-gray-500 block">CLABE Interbancaria (18 dígitos):</span>
                <strong className="text-brand-orange font-black text-base tracking-widest select-all">
                  012 650 00123456789 0
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* INSTRUCCIONES DE TARJETA */}
        {!isTransfer && (
          <div className="bg-black/60 p-5 rounded-2xl border border-gray-800 mb-6">
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              Deslice, inserte o aproxime la tarjeta en la terminal bancaria (TPV). Una vez aprobada la transacción, introduzca el número de comprobante.
            </p>
          </div>
        )}

        {/* FORMULARIO DE CAPTURA OBLIGATORIA */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2 flex justify-between">
              <span>{isTransfer ? 'Introduzca el Número de Referencia / Folio' : 'Número de Transacción / Autorización (Voucher)'} *</span>
              <span className="text-red-500 font-mono">Obligatorio</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder={isTransfer ? "Ej. 849201 o clave de rastreo" : "Ej. AUT: 049281"}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-[#1a1a1a] border-2 border-gray-700 focus:border-brand-orange text-white text-xl font-mono font-bold rounded-2xl px-5 py-4 focus:outline-none transition-all shadow-inner placeholder-gray-600"
            />
            <p className="text-[11px] text-gray-500 mt-2">
              ⚠️ No se podrá procesar ni liberar el inventario hasta capturar este dato.
            </p>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex space-x-4 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={reference.trim().length === 0}
              className="w-1/2 py-4 bg-brand-orange hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-800 disabled:cursor-not-allowed text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_25px_rgba(255,90,0,0.3)] flex items-center justify-center space-x-2 border border-brand-orange"
            >
              <span>✓ Cobro Listo</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PosPaymentModal;