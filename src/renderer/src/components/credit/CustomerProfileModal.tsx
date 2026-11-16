// src/components/credit/CustomerProfileModal.tsx
import React from 'react';
import {
  CreditAccountDetail,
  CustomerFullProfile,
  CustomerSummary,
} from '../../types/credit';
import {
  X,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Package,
  Eye,
  Edit3,
} from 'lucide-react';

interface CustomerProfileModalProps {
  profile: CustomerFullProfile | null;
  isLoading: boolean;
  onClose: () => void;
  onSelectAccountDetail: (account: CreditAccountDetail) => void;
  onPaySpecificAccount: (account: CreditAccountDetail) => void;
  onPayGeneralDebt: (customer: CustomerSummary) => void;
  onEditCustomer: (customer: CustomerSummary) => void;
}

const formatMoney = (val: number) =>
  `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
};

const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  profile,
  isLoading,
  onClose,
  onSelectAccountDetail,
  onPaySpecificAccount,
  onPayGeneralDebt,
  onEditCustomer,
}) => {
  if (!profile && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-6xl w-full bg-[#121212] rounded-3xl border border-gray-800 p-6 md:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {isLoading || !profile ? (
          <div className="py-20 text-center text-gray-400 font-bold">
            Cargando expediente completo del cliente...
          </div>
        ) : (
          <>
            {/* CABECERA DEL EXPEDIENTE */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-800 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
                    Expediente de Cliente de Confianza
                  </span>
                  {profile.customer.alias && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                      {profile.customer.alias}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {profile.customer.name}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-1.5">
                  {profile.customer.phone && (
                    <span className="flex items-center gap-1 text-gray-200">
                      <Phone className="w-3.5 h-3.5 text-brand-orange" /> {profile.customer.phone}
                    </span>
                  )}
                  {profile.customer.secondaryPhone && (
                    <span>Tel. 2: {profile.customer.secondaryPhone}</span>
                  )}
                  {profile.customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-brand-orange" /> {profile.customer.email}
                    </span>
                  )}
                  {profile.customer.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {profile.customer.address}
                    </span>
                  )}
                </div>
                {profile.customer.notes && (
                  <p className="text-xs text-gray-400 italic mt-1">
                    Nota: &ldquo;{profile.customer.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onEditCustomer(profile.customer)}
                  className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Contacto</span>
                </button>

                {profile.totalCurrentDebt > 0 && (
                  <button
                    type="button"
                    onClick={() => onPayGeneralDebt(profile.customer)}
                    className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(255,90,0,0.3)] transition-all cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Abono General ({formatMoney(profile.totalCurrentDebt)})</span>
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

            {/* CUERPO DEL EXPEDIENTE */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pt-5 pr-1">
              {/* TARJETAS DE RESUMEN DEL CLIENTE */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4">
                  <span className="text-xs font-sans font-bold text-gray-400 block">
                    Total Adquirido Histórico
                  </span>
                  <strong className="text-xl font-black text-white mt-1 block">
                    {formatMoney(profile.totalHistoricalPurchased)}
                  </strong>
                  <span className="text-[11px] font-sans text-gray-500">
                    {profile.accounts.length} cuenta(s) registrada(s)
                  </span>
                </div>

                <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4">
                  <span className="text-xs font-sans font-bold text-emerald-400 block">
                    Total Abonado Histórico
                  </span>
                  <strong className="text-xl font-black text-emerald-400 mt-1 block">
                    {formatMoney(profile.totalHistoricalPaid)}
                  </strong>
                  <span className="text-[11px] font-sans text-gray-500">
                    {profile.recentPayments.length} pago(s)
                  </span>
                </div>

                <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4">
                  <span className="text-xs font-sans font-bold text-purple-400 block">
                    Total Devuelto
                  </span>
                  <strong className="text-xl font-black text-purple-400 mt-1 block">
                    {formatMoney(profile.totalHistoricalReturned)}
                  </strong>
                  <span className="text-[11px] font-sans text-gray-500">
                    Acreditado en cuentas
                  </span>
                </div>

                <div
                  className={`rounded-2xl p-4 border-2 ${
                    profile.totalCurrentDebt > 0
                      ? 'bg-brand-orange/10 border-brand-orange/60'
                      : 'bg-emerald-500/10 border-emerald-500/40'
                  }`}
                >
                  <span className="text-xs font-sans font-black uppercase text-brand-orange block">
                    Deuda Total Actual
                  </span>
                  <strong className="text-2xl font-black text-white mt-1 block">
                    {formatMoney(profile.totalCurrentDebt)}
                  </strong>
                  <span className="text-[11px] font-sans text-gray-300">
                    {profile.customer.creditLimit
                      ? `Límite: ${formatMoney(profile.customer.creditLimit)}`
                      : 'Sin límite tope'}
                  </span>
                </div>
              </div>

              {/* LISTA DE CUENTAS (QUÉ SE LLEVÓ, CUÁNDO Y CUÁNTO DEBE EN CADA UNA) */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-orange" />
                  <span>Cuentas y Ventas Adquiridas por este Cliente ({profile.accounts.length})</span>
                </h4>

                {profile.accounts.length === 0 ? (
                  <div className="bg-[#161616] border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
                    Este cliente aún no tiene ventas a crédito registradas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className={`bg-[#161616] border rounded-2xl p-4 transition-all ${
                          acc.balance > 0
                            ? 'border-gray-700 hover:border-brand-orange/50'
                            : 'border-gray-800/70 opacity-80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-black text-base text-white">
                                {acc.folio}
                              </span>
                              <span className="text-xs font-mono text-gray-400">
                                (Ticket {acc.saleFolio})
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  acc.balance <= 0
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : acc.isOverdue
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {acc.balance <= 0
                                  ? 'Liquidado'
                                  : acc.isOverdue
                                  ? 'Vencido'
                                  : acc.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                                Adquirió: <strong className="text-gray-200">{formatDateTime(acc.saleDate)}</strong>
                              </span>
                              <span>Atendió: {acc.soldByUserName}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4 font-mono">
                            <div className="text-right text-xs">
                              <span className="text-gray-400 block">Se llevó:</span>
                              <strong className="text-white">{formatMoney(acc.originalAmount)}</strong>
                            </div>
                            {acc.returnedAmount > 0 && (
                              <div className="text-right text-xs">
                                <span className="text-purple-400 block">Devolvió:</span>
                                <strong className="text-purple-400">-{formatMoney(acc.returnedAmount)}</strong>
                              </div>
                            )}
                            <div className="text-right text-xs">
                              <span className="text-emerald-400 block">Abonado:</span>
                              <strong className="text-emerald-400">{formatMoney(acc.paidAmount)}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-sans font-bold uppercase text-amber-400 block">
                                Debe:
                              </span>
                              <strong
                                className={`text-lg font-black ${
                                  acc.balance > 0 ? 'text-brand-orange' : 'text-emerald-400'
                                }`}
                              >
                                {formatMoney(acc.balance)}
                              </strong>
                            </div>

                            <div className="flex items-center gap-2 font-sans">
                              <button
                                type="button"
                                onClick={() => onSelectAccountDetail(acc)}
                                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Detalle</span>
                              </button>
                              {acc.balance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onPaySpecificAccount(acc)}
                                  className="px-3.5 py-2 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-xs font-black cursor-pointer"
                                >
                                  Abonar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Resumen rápido de los artículos que se llevó en esta venta */}
                        <div className="pt-2.5 flex flex-wrap gap-2">
                          {acc.items.map((item) => (
                            <span
                              key={item.saleDetailId}
                              className="text-xs bg-black/50 border border-gray-800 rounded-lg px-2.5 py-1 text-gray-300"
                            >
                              <strong className="text-brand-orange font-mono">
                                {item.netQuantityKept}x
                              </strong>{' '}
                              {item.productName}{' '}
                              <span className="text-gray-500 font-mono">
                                ({formatMoney(item.netSubtotal)})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerProfileModal;
