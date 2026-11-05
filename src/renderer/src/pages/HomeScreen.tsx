// src/pages/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleService } from '../services/saleService';
import { workTaskService } from '../services/workTaskService';
import { DashboardSummary } from '../types/dashboard';
import { WorkTask } from '../types/workTask';
import {
  RefreshCw,
  ShoppingCart,
  Package,
  ClipboardList,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate?: (view: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const token = user?.token ?? null;

  // Estado del reloj en tiempo real
  const [time, setTime] = useState(new Date());

  // Estado del resumen operativo de ventas e inventario
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Estado para el widget de Mis Tareas Pendientes
  const [myActiveTasks, setMyActiveTasks] = useState<WorkTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Estado para la libreta de notas rápidas persistente por usuario
  const storageKey = useMemo(() => `tlapaleria_quick_notes_${user?.id || user?.usuario || 'guest'}`, [user?.id, user?.usuario]);
  const [nota, setNota] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) || '';
    } catch {
      return '';
    }
  });
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Permisos y Roles
  const isAdmin = useMemo(() => {
    const role = (user?.rol || '').toLowerCase();
    return role === 'admin' || role === 'administrador';
  }, [user?.rol]);

  const canViewFinance = useMemo(() => {
    if (isAdmin) return true;
    const perms = (user as any)?.permisos;
    return !!(perms?.SALES?.includes('view.sales') || perms?.EXPENSES?.includes('view.expenses'));
  }, [user, isAdmin]);

  // 1. Cargar Resumen del Dashboard
  const loadDashboardSummary = useCallback(async () => {
    if (!token) return;
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await saleService.getDashboardSummary(token);
      if (res && res.success && res.data) {
        setSummary(res.data);
        setLastUpdated(new Date());
      } else {
        setSummaryError(res?.message || 'No se pudo cargar el resumen de ventas.');
      }
    } catch (err) {
      console.error('Error al cargar dashboard summary:', err);
      setSummaryError('Error de conexión al cargar estadísticas.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [token]);

  // 2. Cargar Mis Tareas Activas
  const loadMyActiveTasks = useCallback(async () => {
    if (!token) return;
    setIsLoadingTasks(true);
    try {
      const res = await workTaskService.getMyTasks(token);
      if (res.ok) {
        const json = await res.json();
        const all: WorkTask[] = json.data || [];
        setMyActiveTasks(
          all.filter((t) => t.status === 'Pendiente' || t.status === 'EnProgreso')
        );
      }
    } catch {
      // Silencioso si aún no está desplegado o falla
    } finally {
      setIsLoadingTasks(false);
    }
  }, [token]);

  // Efecto inicial y suscripción a eventos
  useEffect(() => {
    loadDashboardSummary();
    loadMyActiveTasks();

    const handleTasksUpdate = () => loadMyActiveTasks();
    const handleSalesUpdate = () => loadDashboardSummary();

    window.addEventListener('worktasks-updated', handleTasksUpdate);
    window.addEventListener('sale-created', handleSalesUpdate);

    return () => {
      window.removeEventListener('worktasks-updated', handleTasksUpdate);
      window.removeEventListener('sale-created', handleSalesUpdate);
    };
  }, [loadDashboardSummary, loadMyActiveTasks]);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manejador de persistencia de la nota en LocalStorage
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNota(val);
    try {
      localStorage.setItem(storageKey, val);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2000);
    } catch (err) {
      console.error('Error al guardar nota en localStorage:', err);
    }
  };

  const handleClearNote = () => {
    setNota('');
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  // Formato de moneda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Formateadores de fecha y hora
  const formattedTime = time.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-xl flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* HEADER: Saludo, Reloj y Botón de Recarga */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-gray-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Bienvenido, <span className="text-brand-orange">{user?.name || user?.usuario || 'Usuario'}</span>
            </h1>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Administrador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <User className="w-3.5 h-3.5" />
                {user?.rol || 'Cajero'}
              </span>
            )}
          </div>
          <p className="text-brand-text-muted text-base md:text-lg capitalize font-medium mt-1">
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={() => {
              loadDashboardSummary();
              loadMyActiveTasks();
            }}
            disabled={isLoadingSummary || isLoadingTasks}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e1e] hover:bg-gray-800 border border-gray-700/80 text-gray-300 hover:text-white text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Actualizar datos del panel"
          >
            <RefreshCw className={`w-4 h-4 text-brand-orange ${isLoadingSummary ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <div className="bg-black/50 px-5 py-2.5 rounded-2xl border border-gray-800/80 shadow-inner">
            <span className="text-2xl md:text-3xl font-black text-brand-orange tracking-wider font-mono">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCESOS RÁPIDOS OPERATIVOS */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate?.('POS')}
          className="flex items-center justify-center gap-2 p-3 bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/30 text-brand-orange rounded-2xl font-black text-xs md:text-sm transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>Nueva Venta</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('PRODUCTS')}
          className="flex items-center justify-center gap-2 p-3 bg-[#1e1e1e] hover:bg-gray-800 border border-gray-700/60 text-gray-200 hover:text-white rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
        >
          <Package className="w-4 h-4 text-orange-400 shrink-0" />
          <span>Catálogo</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('WORK')}
          className="flex items-center justify-center gap-2 p-3 bg-[#1e1e1e] hover:bg-gray-800 border border-gray-700/60 text-gray-200 hover:text-white rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
        >
          <ClipboardList className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Tareas ({myActiveTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('RETURNS')}
          className="flex items-center justify-center gap-2 p-3 bg-[#1e1e1e] hover:bg-gray-800 border border-gray-700/60 text-gray-200 hover:text-white rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
        >
          <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Devoluciones</span>
        </button>

        {canViewFinance && (
          <button
            type="button"
            onClick={() => onNavigate?.('FINANCE')}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-xs md:text-sm transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Finanzas</span>
          </button>
        )}
      </div>

      {/* ÁREA DE WIDGETS OPERATIVOS (Grid de 3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        
        {/* WIDGET 1: Venta Total Hoy (Con filtro de usuario vs global) */}
        <div className="bg-[#1e1e1e] border border-gray-700/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/15 rounded-2xl text-emerald-400 border border-emerald-500/30">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {summary?.isGlobal ? 'Venta Total Hoy' : 'Mis Ventas Hoy'}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {summary?.scopeLabel || (isAdmin ? 'Toda la tienda' : 'Tu turno')}
                  </p>
                </div>
              </div>

              {/* BADGE DE ÁMBITO (GLOBAL VS PERSONAL) */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                  summary?.isGlobal
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
                title={
                  summary?.isGlobal
                    ? 'Visualización global permitida por permisos de Administrador / view.sales'
                    : 'Mostrando únicamente tus ventas registradas'
                }
              >
                {summary?.isGlobal ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {summary?.isGlobal ? 'Global' : 'Mi Turno'}
              </span>
            </div>

            {/* MONTO NETO TOTAL */}
            <div className="mt-4">
              {isLoadingSummary ? (
                <div className="h-10 w-44 bg-gray-800/80 animate-pulse rounded-xl" />
              ) : summaryError ? (
                <p className="text-sm font-bold text-red-400">{summaryError}</p>
              ) : (
                <p className="text-4xl lg:text-5xl font-black text-white font-mono tracking-tight text-emerald-400">
                  {formatCurrency(summary?.totalSalesAmount || 0)}
                </p>
              )}
            </div>
          </div>

          {/* DETALLES DE CORTE / REEMBOLSOS */}
          <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between text-xs">
            {summary && summary.totalRefundedAmount > 0 ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                Reembolsos: -{formatCurrency(summary.totalRefundedAmount)}
              </span>
            ) : (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Corte activo en curso
              </span>
            )}

            {canViewFinance && (
              <button
                type="button"
                onClick={() => onNavigate?.('FINANCE')}
                className="text-gray-400 hover:text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Detalle</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* WIDGET 2: Ventas Hoy (Tickets y Desglose de Métodos de Pago) */}
        <div className="bg-[#1e1e1e] border border-gray-700/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500/15 rounded-2xl text-blue-400 border border-blue-500/30">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tickets Hoy</h3>
                  <p className="text-xs text-brand-text-muted mt-0.5">Operaciones cobradas</p>
                </div>
              </div>

              <div className="text-right">
                {isLoadingSummary ? (
                  <div className="h-8 w-12 bg-gray-800/80 animate-pulse rounded-lg" />
                ) : (
                  <span className="text-3xl font-black text-white font-mono">
                    {summary?.totalTicketsCount ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* DESGLOSE POR MÉTODO DE PAGO */}
            <div className="mt-3 space-y-2">
              {isLoadingSummary ? (
                <div className="space-y-2">
                  <div className="h-7 bg-gray-800/60 animate-pulse rounded-xl" />
                  <div className="h-7 bg-gray-800/60 animate-pulse rounded-xl" />
                </div>
              ) : summary?.paymentMethods && summary.paymentMethods.length > 0 ? (
                summary.paymentMethods.map((pm) => {
                  const isCash = pm.method.toLowerCase().includes('efectivo');
                  const isCard = pm.method.toLowerCase().includes('tarjeta');
                  return (
                    <div
                      key={pm.method}
                      className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-gray-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {isCash ? (
                          <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCard ? (
                          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        <span className="font-bold text-gray-200">{pm.method}</span>
                        <span className="text-gray-500 text-[10px]">({pm.count} ops)</span>
                      </div>
                      <span className="font-extrabold text-white font-mono">
                        {formatCurrency(pm.totalAmount)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="bg-black/30 p-3 rounded-xl border border-gray-800/50 text-center">
                  <p className="text-xs text-gray-400">Sin operaciones registradas hoy</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
            <span>{summary?.isGlobal ? 'Todas las terminales' : 'Tu terminal'}</span>
            <button
              type="button"
              onClick={() => onNavigate?.('POS')}
              className="text-brand-orange hover:text-white font-bold transition-colors cursor-pointer"
            >
              Cobrar nueva venta →
            </button>
          </div>
        </div>

        {/* WIDGET 3: Mis Tareas Pendientes */}
        <div className="bg-[#1e1e1e] border border-brand-orange/40 rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-brand-orange/15 rounded-2xl text-brand-orange border border-brand-orange/30">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Mis Tareas</h3>
                  <span className="text-xs text-brand-text-muted">
                    {myActiveTasks.length} {myActiveTasks.length === 1 ? 'actividad' : 'actividades'}
                  </span>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('WORK')}
                  className="px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-xs font-black transition-colors cursor-pointer shadow-sm"
                >
                  Abrir →
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {isLoadingTasks ? (
                <p className="text-xs text-brand-text-muted py-4 text-center">Cargando tareas...</p>
              ) : myActiveTasks.length === 0 ? (
                <div className="bg-black/30 border border-gray-800/60 rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Sin tareas pendientes!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Estás al día con tus actividades operativas.</p>
                </div>
              ) : (
                myActiveTasks.slice(0, 4).map((task) => {
                  const isUrgent = (task.priority || '').toLowerCase() === 'urgente';
                  return (
                    <div
                      key={task.id}
                      onClick={() => onNavigate && onNavigate('WORK')}
                      className="flex items-center justify-between bg-black/40 hover:bg-black/60 p-2.5 rounded-xl border border-gray-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isUrgent
                              ? 'bg-red-500 animate-pulse'
                              : task.status === 'EnProgreso'
                              ? 'bg-blue-400'
                              : 'bg-brand-orange'
                          }`}
                        />
                        <span className="text-xs font-bold text-white truncate">{task.title}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300 shrink-0 ml-2">
                        {task.status === 'EnProgreso' ? 'En Curso' : task.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-right text-xs text-gray-400">
            <span
              onClick={() => onNavigate?.('WORK')}
              className="hover:text-brand-orange cursor-pointer transition-colors"
            >
              Ver tablero de trabajo →
            </span>
          </div>
        </div>

        {/* WIDGET 4: Top Ventas Hoy (Productos más vendidos) */}
        <div className="bg-[#1e1e1e] border border-gray-700/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-500/15 rounded-2xl text-purple-400 border border-purple-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Top Ventas Hoy</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {summary?.isGlobal ? 'Más solicitados en tienda' : 'Tus artículos más vendidos'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {isLoadingSummary ? (
                <div className="space-y-2">
                  <div className="h-10 bg-gray-800/60 animate-pulse rounded-xl" />
                  <div className="h-10 bg-gray-800/60 animate-pulse rounded-xl" />
                </div>
              ) : summary?.topSellingProducts && summary.topSellingProducts.length > 0 ? (
                summary.topSellingProducts.map((p, idx) => (
                  <div
                    key={`${p.productName}-${idx}`}
                    className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-gray-800/60"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate" title={p.productName}>
                        {p.productName}
                      </p>
                      {p.brand && <p className="text-[10px] text-gray-400 truncate">{p.brand}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-brand-orange font-mono">
                        {p.totalQuantity} un
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {formatCurrency(p.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-black/30 border border-gray-800/50 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-gray-400">Sin ventas de productos hoy</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Los productos más vendidos aparecerán aquí al cobrar tickets.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-right text-xs text-gray-400">
            <span
              onClick={() => onNavigate?.('POS')}
              className="hover:text-brand-orange cursor-pointer transition-colors"
            >
              Realizar venta →
            </span>
          </div>
        </div>

        {/* WIDGET 5: Alertas de Inventario en Tiempo Real */}
        <div className="bg-[#1e1e1e] border border-gray-700/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Alertas de Stock</h3>
                  <p className="text-xs text-brand-text-muted mt-0.5">Stock crítico y caducidades</p>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('INVENTORY')}
                  className="text-xs text-brand-orange hover:text-white font-bold transition-colors cursor-pointer"
                >
                  Inventario →
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {isLoadingSummary ? (
                <div className="space-y-2">
                  <div className="h-10 bg-gray-800/60 animate-pulse rounded-xl" />
                  <div className="h-10 bg-gray-800/60 animate-pulse rounded-xl" />
                </div>
              ) : summary?.stockAlerts && summary.stockAlerts.length > 0 ? (
                summary.stockAlerts.map((alert) => {
                  const isOutOfStock = alert.alertType === 'OutOfStock';
                  const isExpiring = alert.alertType === 'ExpiringSoon';
                  return (
                    <div
                      key={`${alert.productId}-${alert.alertType}`}
                      onClick={() => onNavigate?.('PRODUCTS')}
                      className="flex items-center text-gray-200 bg-black/40 hover:bg-black/60 p-2.5 rounded-xl border border-gray-800/60 transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-2.5 h-2.5 min-w-[10px] rounded-full mr-2.5 shrink-0 ${
                          isOutOfStock
                            ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            : isExpiring
                            ? 'bg-yellow-400'
                            : 'bg-orange-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate" title={alert.name}>
                          {alert.name}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-black/30 border border-gray-800/50 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Inventario en buen estado
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Sin faltantes de stock ni productos por vencer.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 text-right text-xs text-gray-400">
            <span
              onClick={() => onNavigate?.('PRODUCTS')}
              className="hover:text-brand-orange cursor-pointer transition-colors"
            >
              Revisar catálogo completo →
            </span>
          </div>
        </div>

        {/* WIDGET 6: Notas Rápidas Personales (Persistente en LocalStorage) */}
        <div className="bg-[#1e1e1e] border border-gray-700/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-500/15 rounded-2xl text-yellow-400 border border-yellow-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Notas Rápidas</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-brand-text-muted">Libreta personal</span>
                    {noteSavedFeedback && (
                      <span className="text-[10px] text-emerald-400 font-bold animate-in fade-in">
                        ✓ Guardado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {nota && (
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                  title="Limpiar nota"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              className="w-full h-36 bg-black/40 border border-gray-800/80 rounded-2xl p-3.5 text-gray-200 resize-none focus:outline-none focus:border-brand-orange/60 focus:ring-1 focus:ring-brand-orange/40 transition-all text-xs md:text-sm custom-scrollbar placeholder-gray-500"
              placeholder="Escribe recordatorios, encargos de clientes o pendientes de turno..."
              value={nota}
              onChange={handleNoteChange}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Se guarda automáticamente en este equipo</span>
            <span>{nota.length} caracteres</span>
          </div>
        </div>

      </div>

      {/* FOOTER INFORMATIVO */}
      {lastUpdated && (
        <div className="mt-6 pt-4 border-t border-gray-800/80 text-center text-xs text-gray-500">
          Última sincronización del panel: <strong className="text-gray-400">{lastUpdated.toLocaleTimeString('es-MX')}</strong>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
