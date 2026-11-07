// src/components/invoice/InvoiceModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import { configService } from '../../services/configService';
import { REGIMENES_FISCALES, USOS_CFDI, FacturaResponse } from '../../types/invoice';

interface InvoiceModalProps {
  saleId: number;
  folio: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess?: (factura: FacturaResponse) => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  saleId,
  folio,
  totalAmount,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();

  // Estados del formulario
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [regimenFiscal, setRegimenFiscal] = useState('616');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [usoCfdi, setUsoCfdi] = useState('G01');
  const [email, setEmail] = useState('');
  const [storePostalCode, setStorePostalCode] = useState('72310');

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaResponse | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Carga el código postal real del negocio configurado en la base de datos
  useEffect(() => {
    if (user?.token) {
      configService.getConfig(user.token).then((res) => {
        if (res.success && res.data?.postalCode) {
          setStorePostalCode(res.data.postalCode);
        }
      });
    }
  }, [user]);

  // Botón rápido para Público en General
  const handleSetPublicoGeneral = () => {
    setRfc('XAXX010101000');
    setRazonSocial('PUBLICO EN GENERAL');
    setRegimenFiscal('616');
    setUsoCfdi('S01');
    setCodigoPostal(storePostalCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;

    setErrorMsg(null);

    // Validaciones básicas
    const cleanRfc = rfc.trim().toUpperCase();
    if (cleanRfc.length < 12 || cleanRfc.length > 13) {
      setErrorMsg('El RFC debe tener 12 caracteres (empresas) o 13 caracteres (personas físicas).');
      return;
    }

    if (!codigoPostal.trim() || codigoPostal.trim().length !== 5) {
      setErrorMsg('El código postal fiscal debe tener exactamente 5 dígitos.');
      return;
    }

    if (!razonSocial.trim()) {
      setErrorMsg('La razón social o nombre completo es obligatorio.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      saleId,
      rfc: cleanRfc,
      razonSocial: razonSocial.trim().toUpperCase(),
      regimenFiscal,
      codigoPostal: codigoPostal.trim(),
      usoCfdi,
      email: email.trim() || undefined
    };

    const res = await invoiceService.emitirFactura(user.token, payload);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setFacturaEmitida(res.data);
      if (onSuccess) onSuccess(res.data);
    } else {
      setErrorMsg(res.message || 'Error al timbrar la factura ante el SAT.');
    }
  };

  const handleDescargarPdf = async () => {
    if (!user?.token || !facturaEmitida) return;
    await invoiceService.descargarPdf(user.token, facturaEmitida.id, facturaEmitida.uuid);
  };

  const handleDescargarXml = async () => {
    if (!user?.token || !facturaEmitida) return;
    await invoiceService.descargarXml(user.token, facturaEmitida.id, facturaEmitida.uuid);
  };

  const handleEnviarEmail = async () => {
    if (!user?.token || !facturaEmitida || !email.trim()) return;
    setEmailStatus('Enviando...');
    const res = await invoiceService.enviarPorEmail(user.token, facturaEmitida.id, email.trim());
    if (res.success) {
      setEmailStatus('✅ Correo enviado con éxito.');
    } else {
      setEmailStatus(`❌ ${res.message || 'No se pudo enviar el correo.'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-[#121212] rounded-3xl border border-gray-800 p-8 shadow-2xl text-left space-y-6 relative overflow-hidden">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <span>🧾</span> Facturar Venta
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Ticket: <span className="text-brand-orange font-bold font-mono">{folio}</span> | Total: <span className="text-green-400 font-bold">${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800/80 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* SI LA FACTURA YA FUE EMITIDA CON ÉXITO */}
        {facturaEmitida ? (
          <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black border border-green-500/40">
              ✓
            </div>

            <div>
              <h4 className="text-2xl font-black text-white">¡Factura Timbrada con Éxito!</h4>
              <p className="text-xs text-gray-400 mt-1 font-mono break-all">
                UUID SAT: <span className="text-brand-orange font-bold">{facturaEmitida.uuid}</span>
              </p>
            </div>

            <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Receptor:</span>
                <span className="text-white font-bold">{facturaEmitida.razonSocial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RFC:</span>
                <span className="text-brand-orange font-mono font-bold">{facturaEmitida.rfc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Fiscal:</span>
                <span className="text-green-400 font-bold">${facturaEmitida.total.toFixed(2)} MXN</span>
              </div>
            </div>

            {/* BOTONES DE DESCARGA */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDescargarPdf}
                className="py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>📥</span> Descargar PDF
              </button>
              <button
                type="button"
                onClick={handleDescargarXml}
                className="py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>📄</span> Descargar XML
              </button>
            </div>

            {/* ENVÍO POR CORREO */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enviar al correo del cliente..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black/60 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={handleEnviarEmail}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm rounded-xl transition-colors"
              >
                ✉️ Enviar
              </button>
            </div>

            {emailStatus && (
              <p className="text-xs font-bold text-gray-300">{emailStatus}</p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-black text-lg rounded-2xl transition-all"
            >
              Listo / Finalizar
            </button>
          </div>
        ) : (
          /* FORMULARIO DE FACTURACIÓN */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-200 text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Datos del Receptor (Cliente)</span>
              <button
                type="button"
                onClick={handleSetPublicoGeneral}
                className="text-xs text-brand-orange hover:underline font-bold"
              >
                ⚡ Público en General
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">RFC *</label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Código Postal Fiscal *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, ''))}
                  placeholder="26015"
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Razón Social / Nombre Oficial *</label>
              <input
                type="text"
                required
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                placeholder="Tal como aparece en la Constancia del SAT"
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Régimen Fiscal *</label>
                <select
                  value={regimenFiscal}
                  onChange={(e) => setRegimenFiscal(e.target.value)}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                >
                  {REGIMENES_FISCALES.map((r) => (
                    <option key={r.clave} value={r.clave} className="bg-gray-900 text-white">
                      {r.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Uso de CFDI *</label>
                <select
                  value={usoCfdi}
                  onChange={(e) => setUsoCfdi(e.target.value)}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                >
                  {USOS_CFDI.map((u) => (
                    <option key={u.clave} value={u.clave} className="bg-gray-900 text-white">
                      {u.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Correo Electrónico (Opcional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/3 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-brand-orange hover:bg-orange-500 text-brand-deep-dark font-black rounded-xl transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Timbrando ante SAT...</span>
                  </>
                ) : (
                  <span>🧾 Timbrar Factura CFDI 4.0</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default InvoiceModal;
