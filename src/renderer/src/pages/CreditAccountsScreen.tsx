// src/pages/CreditAccountsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/customerService';
import { creditAccountService } from '../services/creditAccountService';
import {
  CreateCustomerRequest,
  CreditAccountDetail,
  CreditPaymentRecord,
  CreditPortfolioSummary,
  CustomerFullProfile,
  CustomerSummary,
  RegisterCreditPaymentRequest,
  UpdateCreditAccountRequest,
  UpdateCustomerRequest,
} from '../types/credit';

import CustomerModal from '../components/credit/CustomerModal';
import CreditPaymentModal from '../components/credit/CreditPaymentModal';
import CreditAccountDetailModal from '../components/credit/CreditAccountDetailModal';
import CustomerProfileModal from '../components/credit/CustomerProfileModal';

import {
  Search,
  UserPlus,
  Users,
  DollarSign,
  AlertTriangle,
  Phone,
  MapPin,
  Eye,
  Edit3,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

type ScreenTab = 'accounts' | 'customers' | 'payments';
type AccountFilterStatus = 'Activas' | 'Pendiente' | 'Abonado' | 'Liquidado' | 'Vencidas' | 'Todos';

const formatMoney = (val: number) =>
  `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
};

const CreditAccountsScreen: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token || '';

  const [activeTab, setActiveTab] = useState<ScreenTab>('accounts');

  // Resumen superior de cartera
  const [summary, setSummary] = useState<CreditPortfolioSummary | null>(null);

  // =========================================================================
  // ESTADOS PESTAÑA 1: CUENTAS Y DEUDAS
  // =========================================================================
  const [accounts, setAccounts] = useState<CreditAccountDetail[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountFilterStatus>('Activas');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountPage, setAccountPage] = useState(1);
  const [accountTotalPages, setAccountTotalPages] = useState(1);

  // =========================================================================
  // ESTADOS PESTAÑA 2: DIRECTORIO DE CLIENTES
  // =========================================================================
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerFilter, setCustomerFilter] = useState<'active' | 'withDebt' | 'inactive'>('active');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);

  // =========================================================================
  // ESTADOS PESTAÑA 3: HISTORIAL DE ABONOS
  // =========================================================================
  const [payments, setPayments] = useState<CreditPaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);

  // =========================================================================
  // MODALES Y NOTIFICACIONES
  // =========================================================================
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal de Crear / Editar Cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerSummary | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerModalError, setCustomerModalError] = useState<string | null>(null);

  // Modal de Detalle de Cuenta
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<CreditAccountDetail | null>(null);

  // Modal de Expediente Completo del Cliente
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerFullProfile | null>(null);
  const [loadingCustomerProfile, setLoadingCustomerProfile] = useState(false);

  // Modal de Abono (a cuenta individual o general al cliente)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetAccount, setPaymentTargetAccount] = useState<CreditAccountDetail | null>(null);
  const [paymentTargetCustomer, setPaymentTargetCustomer] = useState<CustomerSummary | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cargar resumen de cartera
  const fetchSummary = useCallback(async () => {
    if (!token) return;
    const res = await creditAccountService.getPortfolioSummary(token);
    if (res && res.success && res.data) {
      setSummary(res.data);
    }
  }, [token]);

  // Cargar listado de cuentas
  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setLoadingAccounts(true);
    const isOverdueFilter = accountStatusFilter === 'Vencidas';
    const statusParam = isOverdueFilter ? 'Activas' : accountStatusFilter;

    const res = await creditAccountService.getAccounts(token, {
      status: statusParam,
      onlyOverdue: isOverdueFilter,
      search: accountSearch,
      pageNumber: accountPage,
      pageSize: 15,
    });

    if (res && res.success && res.data) {
      setAccounts(res.data.data || []);
      setAccountTotalPages(res.data.totalPages || 1);
    } else {
      setAccounts([]);
    }
    setLoadingAccounts(false);
  }, [token, accountStatusFilter, accountSearch, accountPage]);

  // Cargar directorio de clientes
  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    setLoadingCustomers(true);
    const res = await customerService.getCustomers(token, {
      isActive: customerFilter !== 'inactive',
      onlyWithDebt: customerFilter === 'withDebt',
      search: customerSearch,
      pageNumber: customerPage,
      pageSize: 15,
    });

    if (res && res.success && res.data) {
      setCustomers(res.data.data || []);
      setCustomerTotalPages(res.data.totalPages || 1);
    } else {
      setCustomers([]);
    }
    setLoadingCustomers(false);
  }, [token, customerFilter, customerSearch, customerPage]);

  // Cargar historial de abonos
  const fetchPayments = useCallback(async () => {
    if (!token) return;
    setLoadingPayments(true);
    const res = await creditAccountService.getPaymentsHistory(token, {
      pageNumber: paymentPage,
      pageSize: 20,
    });

    if (res && res.success && res.data) {
      setPayments(res.data.data || []);
      setPaymentTotalPages(res.data.totalPages || 1);
    } else {
      setPayments([]);
    }
    setLoadingPayments(false);
  }, [token, paymentPage]);

  const refreshAll = useCallback(() => {
    fetchSummary();
    if (activeTab === 'accounts') fetchAccounts();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'payments') fetchPayments();
  }, [activeTab, fetchSummary, fetchAccounts, fetchCustomers, fetchPayments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'accounts') fetchAccounts();
      else if (activeTab === 'customers') fetchCustomers();
      else if (activeTab === 'payments') fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, fetchAccounts, fetchCustomers, fetchPayments]);

  // Abrir expediente completo de un cliente
  const handleOpenCustomerProfile = async (customerId: number) => {
    if (!token) return;
    setLoadingCustomerProfile(true);
    setSelectedCustomerProfile(null);
    const res = await customerService.getCustomerFullProfile(token, customerId);
    setLoadingCustomerProfile(false);
    if (res && res.success && res.data) {
      setSelectedCustomerProfile(res.data);
    } else {
      showToast('❌ No se pudo cargar el expediente del cliente.');
    }
  };

  // Guardar (crear o editar) cliente
  const handleSaveCustomer = async (
    payload: CreateCustomerRequest | UpdateCustomerRequest
  ) => {
    if (!token) return;
    setSavingCustomer(true);
    setCustomerModalError(null);

    const res = editingCustomer
      ? await customerService.updateCustomer(
          token,
          editingCustomer.id,
          payload as UpdateCustomerRequest
        )
      : await customerService.createCustomer(token, payload);

    setSavingCustomer(false);

    if (res && res.success) {
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      showToast(
        editingCustomer
          ? '✓ Información del cliente actualizada.'
          : '✓ Cliente registrado exitosamente.'
      );
      fetchCustomers();
      fetchSummary();
      if (selectedCustomerProfile && editingCustomer) {
        handleOpenCustomerProfile(editingCustomer.id);
      }
    } else {
      setCustomerModalError(res?.message || 'Error al guardar el cliente.');
    }
  };

  // Confirmar abono (a cuenta individual o general al cliente)
  const handleConfirmPayment = async (payload: RegisterCreditPaymentRequest) => {
    if (!token) return;
    setSubmittingPayment(true);
    setPaymentModalError(null);

    if (paymentTargetAccount) {
      const res = await creditAccountService.registerAccountPayment(
        token,
        paymentTargetAccount.id,
        payload
      );
      setSubmittingPayment(false);

      if (res && res.success && res.data) {
        setIsPaymentModalOpen(false);
        showToast(`💵 ${res.message}`);
        if (selectedAccountDetail?.id === res.data.id) {
          setSelectedAccountDetail(res.data);
        }
        if (selectedCustomerProfile?.customer.id === res.data.customerId) {
          handleOpenCustomerProfile(res.data.customerId);
        }
        refreshAll();
      } else {
        setPaymentModalError(res?.message || 'No se pudo registrar el abono.');
      }
    } else if (paymentTargetCustomer) {
      const res = await creditAccountService.registerGeneralCustomerPayment(
        token,
        paymentTargetCustomer.id,
        payload
      );
      setSubmittingPayment(false);

      if (res && res.success && res.data) {
        setIsPaymentModalOpen(false);
        showToast(`💵 ${res.message}`);
        if (selectedCustomerProfile?.customer.id === paymentTargetCustomer.id) {
          handleOpenCustomerProfile(paymentTargetCustomer.id);
        }
        refreshAll();
      } else {
        setPaymentModalError(res?.message || 'No se pudo registrar el abono general.');
      }
    }
  };

  // Actualizar fecha límite o nota de una cuenta
  const handleUpdateAccountMetadata = async (
    accountId: number,
    payload: UpdateCreditAccountRequest
  ) => {
    if (!token) return;
    const res = await creditAccountService.updateAccountMetadata(token, accountId, payload);
    if (res && res.success && res.data) {
      setSelectedAccountDetail(res.data);
      showToast('✓ Fecha compromiso y notas actualizadas.');
      refreshAll();
    } else {
      showToast(`❌ ${res?.message || 'Error al actualizar la cuenta.'}`);
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      {/* NOTIFICACIÓN TOAST */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-brand-orange/50 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-white font-bold text-sm">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. CABECERA PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-800 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>🤝</span>
            <span>Clientes y Cuentas por Cobrar</span>
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            Control de ventas a crédito (fiado), información de contacto, detalle de mercancía entregada y abonos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Pestañas */}
          <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-brand-orange text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cuentas y Deudas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-brand-orange text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Clientes de Confianza
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-brand-orange text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Historial de Abonos
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setCustomerModalError(null);
              setIsCustomerModalOpen(true);
            }}
            className="bg-brand-orange hover:bg-orange-500 text-black px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>

          <button
            type="button"
            onClick={refreshAll}
            title="Actualizar datos"
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. TARJETAS KPI DE RESUMEN DE CARTERA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 shrink-0 font-mono">
        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-sans font-bold text-gray-400 block">
              Total por Cobrar (En la calle)
            </span>
            <strong className="text-2xl font-black text-brand-orange mt-1 block">
              {formatMoney(summary?.totalReceivableBalance || 0)}
            </strong>
            <span className="text-[11px] font-sans text-gray-500">
              {summary?.activeAccountsCount || 0} ticket(s) con saldo abierto
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-sans font-bold text-gray-400 block">
              Clientes con Deuda Activa
            </span>
            <strong className="text-2xl font-black text-white mt-1 block">
              {summary?.customersWithDebtCount || 0}
            </strong>
            <span className="text-[11px] font-sans text-gray-500">
              Clientes con cuenta pendiente
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-sans font-bold text-gray-400 block">
              Cuentas Vencidas
            </span>
            <strong
              className={`text-2xl font-black mt-1 block ${
                (summary?.overdueAccountsCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {summary?.overdueAccountsCount || 0} ({formatMoney(summary?.overdueBalance || 0)})
            </strong>
            <span className="text-[11px] font-sans text-gray-500">
              Pasaron su fecha compromiso
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-sans font-bold text-gray-400 block">
              Abonos Cobrados Hoy
            </span>
            <strong className="text-2xl font-black text-emerald-400 mt-1 block">
              {formatMoney(summary?.collectedTodayAmount || 0)}
            </strong>
            <span className="text-[11px] font-sans text-gray-500">
              Fiado hoy: {formatMoney(summary?.creditGrantedTodayAmount || 0)}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. CONTENIDO DINÁMICO SEGÚN LA PESTAÑA ACTIVA */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* =================================================================== */}
        {/* PESTAÑA 1: CUENTAS Y DEUDAS (POR TICKET) */}
        {/* =================================================================== */}
        {activeTab === 'accounts' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Barra de Filtros y Buscador */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
              <div className="flex flex-wrap bg-black/50 p-1 rounded-xl border border-gray-800 gap-1">
                {(
                  [
                    { id: 'Activas', label: 'Con Deuda' },
                    { id: 'Pendiente', label: 'Sin Abonos' },
                    { id: 'Abonado', label: 'Con Abonos' },
                    { id: 'Vencidas', label: '⚠️ Vencidas' },
                    { id: 'Liquidado', label: '✓ Liquidadas' },
                    { id: 'Todos', label: 'Todas' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setAccountStatusFilter(st.id);
                      setAccountPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      accountStatusFilter === st.id
                        ? 'bg-brand-orange text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => {
                    setAccountSearch(e.target.value);
                    setAccountPage(1);
                  }}
                  placeholder="Buscar por cliente, teléfono o folio..."
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Tabla de Cuentas */}
            <div className="flex-1 min-h-0 bg-[#121212] border border-gray-800 rounded-2xl overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#181818] border-b border-gray-800 text-gray-400 text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Cliente / Contacto</th>
                    <th className="py-3.5 px-3 font-bold">Adquisición / Folio</th>
                    <th className="py-3.5 px-3 font-bold">Qué se Llevó</th>
                    <th className="py-3.5 px-3 font-bold text-right">Se Llevó</th>
                    <th className="py-3.5 px-3 font-bold text-right">Abonado</th>
                    <th className="py-3.5 px-3 font-bold text-right text-brand-orange">Lo que Debe</th>
                    <th className="py-3.5 px-3 font-bold text-center">Estado</th>
                    <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loadingAccounts ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500 font-bold">
                        Cargando cuentas de crédito...
                      </td>
                    </tr>
                  ) : accounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        No se encontraron cuentas con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerProfile(acc.customerId)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="font-extrabold text-white group-hover:text-brand-orange transition-colors block">
                              {acc.customerName}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              {acc.customerAlias && (
                                <span className="text-brand-orange font-semibold">
                                  {acc.customerAlias}
                                </span>
                              )}
                              {acc.customerPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {acc.customerPhone}
                                </span>
                              )}
                            </div>
                          </button>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-white text-xs block">
                            {acc.folio}
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            {formatDateTime(acc.saleDate)}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            Ticket: {acc.saleFolio}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="text-xs text-gray-300 truncate">
                            {acc.items
                              .slice(0, 2)
                              .map((i) => `${i.netQuantityKept}x ${i.productName}`)
                              .join(', ')}
                            {acc.items.length > 2 && ` (+${acc.items.length - 2} más)`}
                          </div>
                          {acc.notes && (
                            <span className="text-[11px] text-gray-500 italic block truncate">
                              Nota: {acc.notes}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-gray-200">
                          {formatMoney(acc.originalAmount)}
                          {acc.returnedAmount > 0 && (
                            <span className="block text-[10px] text-purple-400">
                              Dev: -{formatMoney(acc.returnedAmount)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-bold">
                          {formatMoney(acc.paidAmount)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono">
                          <strong
                            className={`text-base font-black ${
                              acc.balance > 0 ? 'text-brand-orange' : 'text-emerald-400'
                            }`}
                          >
                            {formatMoney(acc.balance)}
                          </strong>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              acc.balance <= 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : acc.isOverdue
                                ? 'bg-red-500/20 text-red-400'
                                : acc.status === 'Abonado'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {acc.balance <= 0
                              ? 'Liquidado'
                              : acc.isOverdue
                              ? 'Vencido'
                              : acc.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAccountDetail(acc)}
                              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Ver qué productos se llevó, cuándo y abonos"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detalle</span>
                            </button>

                            {acc.balance > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentTargetAccount(acc);
                                  setPaymentTargetCustomer(null);
                                  setPaymentModalError(null);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-xs font-black cursor-pointer"
                              >
                                Abonar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación Cuentas */}
            {accountTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 text-xs text-gray-400 shrink-0">
                <span>
                  Página {accountPage} de {accountTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={accountPage <= 1}
                    onClick={() => setAccountPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 text-white font-bold cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={accountPage >= accountTotalPages}
                    onClick={() => setAccountPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 text-white font-bold cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PESTAÑA 2: DIRECTORIO DE CLIENTES DE CONFIANZA */}
        {/* =================================================================== */}
        {activeTab === 'customers' && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
              <div className="flex bg-black/50 p-1 rounded-xl border border-gray-800 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerFilter('active');
                    setCustomerPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    customerFilter === 'active'
                      ? 'bg-brand-orange text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Todos Activos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerFilter('withDebt');
                    setCustomerPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    customerFilter === 'withDebt'
                      ? 'bg-brand-orange text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Con Deuda Pendiente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerFilter('inactive');
                    setCustomerPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    customerFilter === 'inactive'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Inactivos
                </button>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomerPage(1);
                  }}
                  placeholder="Buscar cliente por nombre, apodo o teléfono..."
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-[#121212] border border-gray-800 rounded-2xl overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#181818] border-b border-gray-800 text-gray-400 text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Cliente / Referencia</th>
                    <th className="py-3.5 px-3 font-bold">Contacto y Dirección</th>
                    <th className="py-3.5 px-3 font-bold text-center">Cuentas Activas</th>
                    <th className="py-3.5 px-3 font-bold text-right">Límite de Crédito</th>
                    <th className="py-3.5 px-3 font-bold text-right text-brand-orange">Deuda Total</th>
                    <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 font-bold">
                        Cargando directorio de clientes...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        No se encontraron clientes registrados.
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{cust.name}</span>
                            {cust.alias && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-brand-orange font-bold">
                                {cust.alias}
                              </span>
                            )}
                          </div>
                          {cust.notes && (
                            <p className="text-xs text-gray-500 italic truncate max-w-xs mt-0.5">
                              {cust.notes}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-xs text-gray-300 space-y-0.5">
                          {cust.phone ? (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-brand-orange" />
                              <span>{cust.phone}</span>
                              {cust.secondaryPhone && (
                                <span className="text-gray-500">/ {cust.secondaryPhone}</span>
                              )}
                            </p>
                          ) : (
                            <span className="text-gray-600">Sin teléfono</span>
                          )}
                          {cust.address && (
                            <p className="flex items-center gap-1.5 text-gray-400">
                              <MapPin className="w-3.5 h-3.5 text-gray-500" />
                              <span>{cust.address}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              cust.activeAccountsCount > 0
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            {cust.activeAccountsCount} activa(s)
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-gray-300">
                          {cust.creditLimit ? formatMoney(cust.creditLimit) : 'Sin límite'}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono">
                          <strong
                            className={`text-base font-black ${
                              cust.currentDebt > 0 ? 'text-brand-orange' : 'text-emerald-400'
                            }`}
                          >
                            {formatMoney(cust.currentDebt)}
                          </strong>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenCustomerProfile(cust.id)}
                              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-brand-orange" />
                              <span>Expediente</span>
                            </button>

                            {cust.currentDebt > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentTargetCustomer(cust);
                                  setPaymentTargetAccount(null);
                                  setPaymentModalError(null);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-xs font-black cursor-pointer"
                              >
                                Abono General
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomer(cust);
                                setCustomerModalError(null);
                                setIsCustomerModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white cursor-pointer"
                              title="Editar contacto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {customerTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 text-xs text-gray-400 shrink-0">
                <span>
                  Página {customerPage} de {customerTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={customerPage <= 1}
                    onClick={() => setCustomerPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 text-white font-bold cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={customerPage >= customerTotalPages}
                    onClick={() => setCustomerPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 text-white font-bold cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PESTAÑA 3: HISTORIAL DE ABONOS RECIBIDOS */}
        {/* =================================================================== */}
        {activeTab === 'payments' && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 bg-[#121212] border border-gray-800 rounded-2xl overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#181818] border-b border-gray-800 text-gray-400 text-xs uppercase sticky top-0 z-10">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Folio Abono</th>
                    <th className="py-3.5 px-3 font-bold">Fecha y Hora</th>
                    <th className="py-3.5 px-3 font-bold">Cliente</th>
                    <th className="py-3.5 px-3 font-bold">Cuenta / Ticket</th>
                    <th className="py-3.5 px-3 font-bold">Método / Referencia</th>
                    <th className="py-3.5 px-3 font-bold">Recibió</th>
                    <th className="py-3.5 px-4 font-bold text-right text-emerald-400">Monto Abonado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loadingPayments ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 font-bold">
                        Cargando historial de abonos...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        Aún no hay abonos registrados.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                          {pay.paymentFolio}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-gray-300">
                          {formatDateTime(pay.createdAt)}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white">
                          {pay.customerName}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-xs text-gray-300">
                          <span className="text-brand-orange font-bold">{pay.creditAccountFolio}</span>
                          <span className="block text-[10px] text-gray-500">
                            Ticket: {pay.saleFolio}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-gray-300">
                          <span className="px-2 py-0.5 rounded bg-gray-800 font-semibold">
                            {pay.paymentMethod}
                          </span>
                          {pay.paymentReference && (
                            <span className="ml-2 font-mono text-gray-400">
                              Ref: {pay.paymentReference}
                            </span>
                          )}
                          {pay.notes && (
                            <span className="block text-[11px] text-gray-500 italic mt-0.5">
                              {pay.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-gray-300">
                          {pay.receivedByUserName}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-base text-emerald-400">
                          +{formatMoney(pay.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {paymentTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 text-xs text-gray-400 shrink-0">
                <span>
                  Página {paymentPage} de {paymentTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={paymentPage <= 1}
                    onClick={() => setPaymentPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 text-white font-bold cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paymentPage >= paymentTotalPages}
                    onClick={() => setPaymentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 text-white font-bold cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALES */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
          setCustomerModalError(null);
        }}
        onSave={handleSaveCustomer}
        isSubmitting={savingCustomer}
        error={customerModalError}
        customerToEdit={editingCustomer}
      />

      <CreditAccountDetailModal
        account={selectedAccountDetail}
        onClose={() => setSelectedAccountDetail(null)}
        onOpenPaymentModal={(acc) => {
          setPaymentTargetAccount(acc);
          setPaymentTargetCustomer(null);
          setPaymentModalError(null);
          setIsPaymentModalOpen(true);
        }}
        onUpdateMetadata={handleUpdateAccountMetadata}
      />

      <CustomerProfileModal
        profile={selectedCustomerProfile}
        isLoading={loadingCustomerProfile}
        onClose={() => setSelectedCustomerProfile(null)}
        onSelectAccountDetail={(acc) => setSelectedAccountDetail(acc)}
        onPaySpecificAccount={(acc) => {
          setPaymentTargetAccount(acc);
          setPaymentTargetCustomer(null);
          setPaymentModalError(null);
          setIsPaymentModalOpen(true);
        }}
        onPayGeneralDebt={(cust) => {
          setPaymentTargetCustomer(cust);
          setPaymentTargetAccount(null);
          setPaymentModalError(null);
          setIsPaymentModalOpen(true);
        }}
        onEditCustomer={(cust) => {
          setEditingCustomer(cust);
          setCustomerModalError(null);
          setIsCustomerModalOpen(true);
        }}
      />

      <CreditPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetAccount(null);
          setPaymentTargetCustomer(null);
          setPaymentModalError(null);
        }}
        account={paymentTargetAccount}
        customer={paymentTargetCustomer}
        onConfirmPayment={handleConfirmPayment}
        isSubmitting={submittingPayment}
        error={paymentModalError}
      />
    </div>
  );
};

export default CreditAccountsScreen;
