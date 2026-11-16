// src/components/credit/CreditAccountDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  CreditAccountDetail,
  UpdateCreditAccountRequest,
} from '../../types/credit';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  RotateCcw,
  Receipt,
  Edit3,
  Save,
} from 'lucide-react';

interface CreditAccountDetailModalProps {
  account: CreditAccountDetail | null;
  onClose: () => void;
  onOpenPaymentModal: (account: CreditAccountDetail) => void;
  onUpdateMetadata?: (
    accountId: number,
    payload: UpdateCreditAccountRequest
  ) => Promise<void>;
}

const formatMoney = (val: number) =>
  `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
};

const CreditAccountDetailModal: React.FC<CreditAccountDetailModalProps> = ({
  account,
  onClose,
  onOpenPaymentModal,
  onUpdateMetadata,
}) => {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [dueDateStr, setDueDateStr] = useState('');
  const [notesStr, setNotesStr] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (account) {
      setIsEditingMeta(false);
      setDueDateStr(
        account.dueDate ? new Date(account.dueDate).toISOString().split('T')[0] : ''
      );
      setNotesStr(account.notes || '');
    }
  }, [account]);

  if (!account) return null;

  const handleSaveMeta = async () => {
    if (!onUpdateMetadata) return;
    setSavingMeta(true);
    await onUpdateMetadata(account.id, {
      dueDate: dueDateStr ? new Date(`${dueDateStr}T23:59:59`).toISOString() : null,
      notes: notesStr.trim() || null,
    });
    setSavingMeta(false);
    setIsEditingMeta(false);
  };

  const statusBadge = () => {
    if (account.status === 'Liquidado' || account.balance <= 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          ✓ Liquidada
        </span>
      );
    }
    if (account.isOverdue) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
          ⚠️ Vencida
        </span>
      );
    }
    if (account.status === 'Abonado') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
          ⏳ Con Abonos Parciales
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
        🕒 Pendiente de Pago
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-5xl w-full bg-[#121212] rounded-3xl border border-gray-800 p-6 md:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* 1. CABECERA */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-2xl text-white">
                {account.folio}
              </span>
              {statusBadge()}
              <span className="text-xs font-mono bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700">
                Ticket: {account.saleFolio}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                Adquirió la venta: <strong className="text-gray-200">{formatDateTime(account.saleDate)}</strong>
              </span>
              <span>
                Atendió: <strong className="text-gray-200">{account.soldByUserName}</strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {account.balance > 0 && (
              <button
                type="button"
                onClick={() => onOpenPaymentModal(account)}
                className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(255,90,0,0.3)] transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Registrar Abono</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pt-5 pr-1">
          {/* 2. TARJETA DEL CLIENTE + RESUMEN MONETARIO DE LO QUE DEBE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Contacto del cliente */}
            <div className="lg:col-span-5 bg-[#181818] border border-gray-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Cliente y Contacto
                </span>
                {onUpdateMetadata && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMeta(!isEditingMeta)}
                    className="text-xs text-gray-400 hover:text-brand-orange flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingMeta ? 'Cancelar' : 'Editar Nota / Vencimiento'}</span>
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-lg font-black text-white">{account.customerName}</h4>
                {account.customerAlias && (
                  <span className="text-xs text-brand-orange font-bold">{account.customerAlias}</span>
                )}
              </div>

              <div className="space-y-1 text-xs text-gray-300">
                {account.customerPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Tel: <strong>{account.customerPhone}</strong></span>
                    {account.customerSecondaryPhone && (
                      <span className="text-gray-400">| Alt: {account.customerSecondaryPhone}</span>
                    )}
                  </p>
                )}
                {account.customerAddress && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{account.customerAddress}</span>
                  </p>
                )}
              </div>

              {isEditingMeta ? (
                <div className="pt-2 border-t border-gray-800 space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Fecha Compromiso de Pago
                    </label>
                    <input
                      type="date"
                      value={dueDateStr}
                      onChange={(e) => setDueDateStr(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Nota / Referencia de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={notesStr}
                      onChange={(e) => setNotesStr(e.target.value)}
                      placeholder="Ej. Material para obra de la escuela"
                      className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingMeta}
                    onClick={handleSaveMeta}
                    className="w-full py-2 bg-brand-orange text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingMeta ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-800 text-xs text-gray-400 space-y-1">
                  <p>
                    Fecha compromiso:{' '}
                    <strong className={account.isOverdue ? 'text-red-400' : 'text-gray-200'}>
                      {account.dueDate
                        ? new Date(account.dueDate).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Sin fecha límite'}
                    </strong>
                  </p>
                  {account.notes && (
                    <p className="text-gray-300 italic">&ldquo;{account.notes}&rdquo;</p>
                  )}
                </div>
              )}
            </div>

            {/* Tarjetas de Desglose de la Deuda */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-sans font-bold uppercase text-gray-400">
                  Total Adquirido
                </span>
                <strong className="text-xl font-black text-white mt-2">
                  {formatMoney(account.originalAmount)}
                </strong>
                <span className="text-[10px] font-sans text-gray-500 mt-1">
                  {account.totalItemsCount} renglón(es)
                </span>
              </div>

              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-sans font-bold uppercase text-purple-400">
                  Devoluciones
                </span>
                <strong className="text-xl font-black text-purple-400 mt-2">
                  -{formatMoney(account.returnedAmount)}
                </strong>
                <span className="text-[10px] font-sans text-gray-500 mt-1">
                  Descontado de cuenta
                </span>
              </div>

              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[11px] font-sans font-bold uppercase text-emerald-400">
                  Total Abonado
                </span>
                <strong className="text-xl font-black text-emerald-400 mt-2">
                  {formatMoney(account.paidAmount)}
                </strong>
                <span className="text-[10px] font-sans text-gray-500 mt-1">
                  {account.payments.length} abono(s)
                </span>
              </div>

              <div
                className={`rounded-2xl p-4 flex flex-col justify-between border-2 ${
                  account.balance > 0
                    ? 'bg-brand-orange/10 border-brand-orange/60'
                    : 'bg-emerald-500/10 border-emerald-500/40'
                }`}
              >
                <span className="text-[11px] font-sans font-black uppercase text-brand-orange">
                  Lo que Debe Hoy
                </span>
                <strong
                  className={`text-2xl font-black mt-2 ${
                    account.balance > 0 ? 'text-brand-orange' : 'text-emerald-400'
                  }`}
                >
                  {formatMoney(account.balance)}
                </strong>
                <span className="text-[10px] font-sans text-gray-300 mt-1">
                  {account.balance > 0 ? 'Saldo pendiente' : 'Liquidado'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. TABLA DE QUÉ SE LLEVÓ Y CUÁNTO SE LLEVÓ */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-orange" />
              <span>Detalle de Material Adquirido en esta Venta ({account.items.length})</span>
            </h4>

            <div className="bg-[#161616] border border-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4 font-bold">Producto / Presentación</th>
                    <th className="py-3 px-3 font-bold">Marca</th>
                    <th className="py-3 px-3 font-bold text-center">Se Llevó</th>
                    <th className="py-3 px-3 font-bold text-center">Devolvió</th>
                    <th className="py-3 px-3 font-bold text-center text-emerald-400">Se Quedó</th>
                    <th className="py-3 px-3 font-bold text-right">Precio Unit.</th>
                    <th className="py-3 px-4 font-bold text-right">Importe Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {account.items.map((item) => (
                    <tr key={item.saleDetailId} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-bold text-white">{item.productName}</td>
                      <td className="py-3 px-3 text-xs text-gray-400">{item.brand || '—'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-gray-200">
                        {item.quantityTaken}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.quantityReturned > 0 ? (
                          <span className="text-purple-400 font-bold">-{item.quantityReturned}</span>
                        ) : (
                          <span className="text-gray-600">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-emerald-400">
                        {item.netQuantityKept}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-300">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-white">
                        {formatMoney(item.netSubtotal)}
                        {item.refundedSubtotal > 0 && (
                          <span className="block text-[10px] text-purple-400">
                            (Orig: {formatMoney(item.originalSubtotal)})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. HISTORIAL DE ABONOS Y DEVOLUCIONES EN DOS COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historial de Abonos */}
            <div className="bg-[#161616] border border-gray-800 rounded-2xl p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span>Historial de Abonos a esta Cuenta ({account.payments.length})</span>
              </h4>

              {account.payments.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  Aún no se han registrado abonos para esta cuenta.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {account.payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="bg-[#121212] border border-gray-800 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {pay.paymentFolio}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold">
                            {pay.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatDateTime(pay.createdAt)} • Cobró: {pay.receivedByUserName}
                        </p>
                        {pay.notes && (
                          <p className="text-[11px] text-gray-500 italic mt-0.5">
                            {pay.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-black text-base text-emerald-400">
                        +{formatMoney(pay.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de Devoluciones sobre esta Cuenta */}
            <div className="bg-[#161616] border border-gray-800 rounded-2xl p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Devoluciones de Mercancía ({account.returns.length})</span>
              </h4>

              {account.returns.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  No se han devuelto artículos de esta cuenta.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {account.returns.map((ret) => (
                    <div
                      key={ret.returnId}
                      className="bg-[#121212] border border-gray-800 rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-white">
                            {ret.returnFolio}
                          </span>
                          <span className="text-[11px] text-gray-400 ml-2">
                            {formatDateTime(ret.createdAt)}
                          </span>
                        </div>
                        <span className="font-mono font-black text-sm text-purple-400">
                          -{formatMoney(ret.totalRefunded)}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-300 space-y-0.5">
                        {ret.items.map((ri, idx) => (
                          <p key={idx}>
                            • {ri.quantityReturned}x {ri.productName} ({formatMoney(ri.refundAmount)})
                          </p>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3 text-[11px] font-mono pt-1 border-t border-gray-800/80">
                        <span className="text-amber-300">
                          Descontado de deuda: <strong>{formatMoney(ret.appliedToDebtAmount)}</strong>
                        </span>
                        {ret.cashRefundedAmount > 0 && (
                          <span className="text-emerald-400">
                            Reembolsado en efectivo: <strong>{formatMoney(ret.cashRefundedAmount)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditAccountDetailModal;
