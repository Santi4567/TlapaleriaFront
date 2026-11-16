// src/components/pos/PosCreditSaleModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/customerService';
import { CustomerSummary } from '../../types/credit';
import {
  Search,
  UserPlus,
  UserCheck,
  Phone,
  MapPin,
  AlertTriangle,
  Calendar,
  FileText,
  DollarSign,
  X,
  Check,
} from 'lucide-react';

export interface CreditCheckoutPayload {
  customerId: number;
  customerName: string;
  initialPayment?: number;
  initialPaymentMethod?: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  paymentReference?: string;
  dueDate?: string;
  creditNotes?: string;
}

interface PosCreditSaleModalProps {
  totalAmount: number;
  isProcessing: boolean;
  onClose: () => void;
  onConfirmCreditSale: (data: CreditCheckoutPayload) => void;
}

const PosCreditSaleModal: React.FC<PosCreditSaleModalProps> = ({
  totalAmount,
  isProcessing,
  onClose,
  onConfirmCreditSale,
}) => {
  const { user } = useAuth();
  const token = user?.token || '';

  // Búsqueda y selección de cliente
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Modo creación rápida de cliente desde el mostrador
  const [isQuickCreate, setIsQuickCreate] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAlias, setNewCustomerAlias] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Datos del crédito / anticipo
  const [initialPaymentStr, setInitialPaymentStr] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [paymentReference, setPaymentReference] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar clientes al abrir o buscar
  useEffect(() => {
    if (!token || isQuickCreate) return;

    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      if (searchTerm.trim()) {
        const res = await customerService.searchCustomers(token, searchTerm.trim(), true);
        if (res && res.success && res.data) {
          setCustomers(res.data);
        } else {
          setCustomers([]);
        }
      } else {
        const res = await customerService.getCustomers(token, {
          isActive: true,
          pageNumber: 1,
          pageSize: 25,
        });
        if (res && res.success && res.data) {
          setCustomers(res.data.data || []);
        } else {
          setCustomers([]);
        }
      }
      setLoadingCustomers(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, token, isQuickCreate]);

  // Cálculos matemáticos en vivo
  const initialPayment = Math.max(0, parseFloat(initialPaymentStr) || 0);
  const netDebtToCreate = Math.max(0, Math.round((totalAmount - initialPayment) * 100) / 100);
  const customerProjectedDebt = (selectedCustomer?.currentDebt || 0) + netDebtToCreate;
  const exceedsCreditLimit =
    selectedCustomer?.creditLimit != null &&
    selectedCustomer.creditLimit > 0 &&
    customerProjectedDebt > selectedCustomer.creditLimit;

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      setErrorMsg('El nombre del cliente es obligatorio.');
      return;
    }

    setCreatingCustomer(true);
    setErrorMsg(null);

    const limitNum = parseFloat(newCustomerCreditLimit);
    const res = await customerService.createCustomer(token, {
      name: newCustomerName.trim(),
      alias: newCustomerAlias.trim() || null,
      phone: newCustomerPhone.trim() || null,
      address: newCustomerAddress.trim() || null,
      creditLimit: !isNaN(limitNum) && limitNum > 0 ? limitNum : null,
    });

    setCreatingCustomer(false);

    if (res && res.success && res.data) {
      const created: CustomerSummary = {
        ...res.data,
        currentDebt: 0,
        activeAccountsCount: 0,
        overdueAccountsCount: 0,
        totalHistoricalAccountsCount: 0,
        availableCredit: res.data.creditLimit ?? null,
      };
      setSelectedCustomer(created);
      setIsQuickCreate(false);
      setNewCustomerName('');
      setNewCustomerAlias('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewCustomerCreditLimit('');
    } else {
      setErrorMsg(res?.message || 'No se pudo registrar el cliente.');
    }
  };

  const handleSubmitCreditSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomer) {
      setErrorMsg('Selecciona un cliente de confianza para asignarle la cuenta.');
      return;
    }

    if (initialPayment >= totalAmount) {
      setErrorMsg('El anticipo cubre el 100% de la venta. Usa cobro de contado (Efectivo, Tarjeta o Transferencia).');
      return;
    }

    if (
      initialPayment > 0 &&
      (initialPaymentMethod === 'Tarjeta' || initialPaymentMethod === 'Transferencia') &&
      !paymentReference.trim()
    ) {
      setErrorMsg(`Ingresa el número de referencia o autorización para el anticipo con ${initialPaymentMethod}.`);
      return;
    }

    if (exceedsCreditLimit) {
      setErrorMsg(
        `El cliente supera su límite de crédito autorizado ($${selectedCustomer.creditLimit?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    onConfirmCreditSale({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      initialPayment: initialPayment > 0 ? initialPayment : undefined,
      initialPaymentMethod: initialPayment > 0 ? initialPaymentMethod : undefined,
      paymentReference: paymentReference.trim() || undefined,
      dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
      creditNotes: creditNotes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-4xl w-full bg-[#121212] rounded-3xl border-2 border-brand-orange/60 p-6 md:p-8 shadow-[0_0_60px_rgba(255,90,0,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* CABECERA */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 shrink-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
              Venta a Crédito / Fiado
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 mt-0.5">
              <span>🤝</span>
              <span>Asignar Cuenta a Cliente de Confianza</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CUERPO EN DOS COLUMNAS */}
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 pr-1">
          {/* COLUMNA IZQUIERDA: SELECCIÓN O ALTA RÁPIDA DE CLIENTE */}
          <div className="lg:col-span-7 flex flex-col bg-[#181818] rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-300">
                1. Cliente de Confianza
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsQuickCreate(!isQuickCreate);
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isQuickCreate
                    ? 'bg-gray-800 text-gray-300 hover:text-white'
                    : 'bg-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-black border border-brand-orange/40'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isQuickCreate ? 'Volver al Buscador' : '+ Nuevo Cliente Rápido'}</span>
              </button>
            </div>

            {isQuickCreate ? (
              <form onSubmit={handleQuickCreateCustomer} className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Ej. Juan Pérez Hernández"
                      className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">
                        Apodo / Oficio / Referencia
                      </label>
                      <input
                        type="text"
                        value={newCustomerAlias}
                        onChange={(e) => setNewCustomerAlias(e.target.value)}
                        placeholder="Ej. Maestro Plomero / Vecino"
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="Ej. 222 123 4567"
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">
                        Dirección / Obra
                      </label>
                      <input
                        type="text"
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                        placeholder="Ej. Calle Reforma #42"
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">
                        Límite de Crédito Opcional ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCustomerCreditLimit}
                        onChange={(e) => setNewCustomerCreditLimit(e.target.value)}
                        placeholder="Sin límite fijo"
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3.5 py-2 text-white text-sm font-mono focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingCustomer}
                  className="w-full py-3 bg-brand-orange hover:bg-orange-500 text-black font-black rounded-xl text-sm transition-all mt-3 cursor-pointer"
                >
                  {creatingCustomer ? 'Guardando Cliente...' : '✓ Guardar y Seleccionar Cliente'}
                </button>
              </form>
            ) : (
              <>
                {/* Buscador */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, apodo o teléfono..."
                    className="w-full bg-[#121212] border border-gray-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Lista de clientes */}
                <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {loadingCustomers ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      Buscando clientes...
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm space-y-2">
                      <p>No se encontraron clientes registrados.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCustomerName(searchTerm);
                          setIsQuickCreate(true);
                        }}
                        className="text-brand-orange font-bold hover:underline cursor-pointer"
                      >
                        + Registrar a &quot;{searchTerm || 'Nuevo Cliente'}&quot; ahora
                      </button>
                    </div>
                  ) : (
                    customers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      return (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setErrorMsg(null);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-brand-orange/15 border-brand-orange shadow-[0_0_15px_rgba(255,90,0,0.2)]'
                              : 'bg-[#121212] border-gray-800 hover:border-gray-600'
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm truncate">
                                {cust.name}
                              </span>
                              {cust.alias && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-brand-orange font-semibold truncate">
                                  {cust.alias}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                              {cust.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {cust.phone}
                                </span>
                              )}
                              {cust.address && (
                                <span className="flex items-center gap-1 truncate max-w-[180px]">
                                  <MapPin className="w-3 h-3" /> {cust.address}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <span className="text-[11px] text-gray-400 block">Deuda actual:</span>
                            <span
                              className={`text-sm font-black ${
                                cust.currentDebt > 0 ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              ${cust.currentDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* COLUMNA DERECHA: RESUMEN DE LA CUENTA, ANTICIPO Y COMPROMISO */}
          <form onSubmit={handleSubmitCreditSale} className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Tarjeta del cliente seleccionado */}
              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Cliente Seleccionado
                  </span>
                  {selectedCustomer && (
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                {selectedCustomer ? (
                  <div className="mt-1.5">
                    <p className="text-lg font-black text-white">{selectedCustomer.name}</p>
                    {selectedCustomer.alias && (
                      <p className="text-xs text-brand-orange font-bold">{selectedCustomer.alias}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-800 text-xs font-mono">
                      <div>
                        <span className="text-gray-400 block">Deuda previa:</span>
                        <strong className="text-amber-400">
                          ${selectedCustomer.currentDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Deuda tras compra:</span>
                        <strong className={exceedsCreditLimit ? 'text-red-400' : 'text-white'}>
                          ${customerProjectedDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    Elige un cliente de la lista izquierda...
                  </p>
                )}
              </div>

              {/* Anticipo Opcional */}
              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  2. ¿Deja algún anticipo / pago inicial hoy? (Opcional)
                </label>

                <div className="relative">
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalAmount}
                    value={initialPaymentStr}
                    onChange={(e) => setInitialPaymentStr(e.target.value)}
                    placeholder="0.00 (Se lleva todo a cuenta)"
                    className="w-full bg-[#121212] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {initialPayment > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setInitialPaymentMethod(m)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            initialPaymentMethod === m
                              ? 'bg-brand-orange text-black border-brand-orange'
                              : 'bg-[#121212] text-gray-400 border-gray-700 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    {(initialPaymentMethod === 'Transferencia' || initialPaymentMethod === 'Tarjeta') && (
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder={`Referencia / Voucher de ${initialPaymentMethod} *`}
                        className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-brand-orange"
                      />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-orange" /> Fecha compromiso
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-400 mb-1">
                      <FileText className="w-3.5 h-3.5 text-brand-orange" /> Nota / Obra
                    </label>
                    <input
                      type="text"
                      value={creditNotes}
                      onChange={(e) => setCreditNotes(e.target.value)}
                      placeholder="Ej. Paga el sábado"
                      className="w-full bg-[#121212] border border-gray-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen Monetario */}
              <div className="bg-black/60 border border-gray-800 rounded-2xl p-4 font-mono space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Total del Ticket:</span>
                  <span className="text-white font-bold">
                    ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {initialPayment > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Anticipo Hoy ({initialPaymentMethod}):</span>
                    <span className="font-bold">
                      -${initialPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline border-t border-gray-800 pt-2">
                  <span className="text-xs font-sans font-black uppercase text-amber-400">
                    Saldo a Deber en Cuenta:
                  </span>
                  <span className="text-2xl font-black text-brand-orange">
                    ${netDebtToCreate.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isProcessing || !selectedCustomer || exceedsCreditLimit}
                className="flex-1 py-3.5 bg-brand-orange hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-base rounded-2xl transition-all shadow-[0_0_25px_rgba(255,90,0,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>{isProcessing ? 'Registrando Cuenta...' : 'Confirmar Venta a Crédito'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PosCreditSaleModal;
