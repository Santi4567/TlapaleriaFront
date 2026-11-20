// src/components/finance/UserSalesSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Award,
  Receipt,
  Search,
  Package,
  Eye,
  Shield,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import {
  UserSalesDetailResponse,
  UserSalesReportItem,
  UserSalesReportResponse,
} from '../../types/report';
import { UserFilterParams } from './UserPeriodSelector';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import UserSalesDetailModal from './UserSalesDetailModal';

interface UserSalesSectionProps {
  data: UserSalesReportResponse;
  filter: UserFilterParams;
}

const UserSalesSection: React.FC<UserSalesSectionProps> = ({ data, filter }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Control del modal de detalle por usuario y caché
  const [selectedUser, setSelectedUser] = useState<UserSalesReportItem | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [detailsByUser, setDetailsByUser] = useState<Record<number, UserSalesDetailResponse>>({});
  const [detailError, setDetailError] = useState<string | null>(null);

  // Al cambiar datos (nuevo filtro de fecha), limpiar modal y caché
  useEffect(() => {
    setSelectedUser(null);
    setDetailsByUser({});
    setDetailError(null);
  }, [data]);

  const formatCurrency = (amount?: number | null) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  const formatQty = (qty?: number | null) =>
    Number(qty || 0).toLocaleString('es-MX', { maximumFractionDigits: 3 });

  const filteredUsers = (data?.users || []).filter((u) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const name = (u.fullName || u.userName || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const role = (u.roleName || '').toLowerCase();
    return name.includes(term) || username.includes(term) || role.includes(term);
  });

  const fetchUserDetail = async (targetUser: UserSalesReportItem, forceReload = false) => {
    if (!forceReload && detailsByUser[targetUser.userId]) {
      return;
    }

    if (!user?.token) return;

    setLoadingDetailId(targetUser.userId);
    setDetailError(null);

    const res = await reportService.getUserSalesDetail(
      user.token,
      targetUser.userId,
      filter.periodType,
      filter.startDate,
      filter.endDate
    );

    if (res && res.success && res.data) {
      setDetailsByUser((prev) => ({
        ...prev,
        [targetUser.userId]: res.data,
      }));
    } else {
      setDetailError(res?.message || 'No se pudo cargar el desglose detallado del usuario.');
    }

    setLoadingDetailId(null);
  };

  const handleOpenUserDetail = (targetUser: UserSalesReportItem) => {
    setSelectedUser(targetUser);
    fetchUserDetail(targetUser);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      {/* 4 Tarjetas de Métricas Globales del Periodo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tarjeta: Venta Neta Global */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_4px_20px_rgba(16,185,129,0.1)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
              Ventas Netas
            </h3>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-white">{formatCurrency(data?.totalNetSales)}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">
              Bruto: {formatCurrency(data?.totalGrossSales)} | Dev: -{formatCurrency(data?.totalRefundedAmount)}
            </p>
          </div>
        </div>

        {/* Tarjeta: Ganancia Real Generada */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-orange-500/30 rounded-2xl p-6 shadow-[0_4px_20px_rgba(249,115,22,0.1)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/40">
              <Award className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-orange-400 font-bold text-sm uppercase tracking-wider">
              Ganancia Real
            </h3>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-white">+{formatCurrency(data?.totalProfitAmount)}</p>
            <p className="text-xs text-orange-500/70 mt-2 font-medium">
              Costo mercancía: {formatCurrency(data?.totalCostOfGoodsSold)}
            </p>
          </div>
        </div>

        {/* Tarjeta: Total Tickets y Usuarios */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Receipt className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
              Tickets Emitidos
            </h3>
          </div>
          <div>
            <p className="text-4xl font-black text-white">{data?.totalTicketsCount ?? 0}</p>
            <p className="text-xs text-purple-400 mt-2 font-medium">
              Generados por {data?.totalUsersCount ?? 0} usuario{(data?.totalUsersCount ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Tarjeta: Piezas / Unidades Vendidas */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
              Piezas Vendidas
            </h3>
          </div>
          <div>
            <p className="text-4xl font-black text-white">{formatQty(data?.totalQuantitySold)}</p>
            <p className="text-xs text-gray-500 mt-2">Unidades físicas despachadas</p>
          </div>
        </div>
      </div>

      {/* Desglose de Métodos de Pago Globales */}
      {data.paymentMethodsSummary && data.paymentMethodsSummary.length > 0 && (
        <div className="bg-[#1a1a1a]/60 border border-gray-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-orange-500" />
            Cobros del Periodo por Método de Pago:
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {data.paymentMethodsSummary.map((pm) => (
              <div
                key={pm.method}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121212] border border-gray-800 text-xs"
              >
                <span className="font-semibold text-gray-400">{pm.method}:</span>
                <span className="font-extrabold text-white">{formatCurrency(pm.totalAmount)}</span>
                <span className="text-gray-500 text-[11px]">({pm.count} ops)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla Desglosada por Usuario */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-500" />
              Rendimiento por Usuario / Cajero ({filteredUsers.length})
            </h3>
            <p className="text-gray-400 text-sm mt-0.5">
              Haz clic en cualquier fila para inspeccionar los productos y tickets que vendió cada usuario.
            </p>
          </div>

          {/* Buscador de usuario */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-gray-800 focus:border-orange-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl">
            <Users className="w-10 h-10 text-gray-600 mb-2" />
            <p className="text-gray-500 font-medium text-base">
              No hay ventas registradas para usuarios en este periodo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Usuario / Cajero</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Tickets</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Piezas Vendidas</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Venta Bruta</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-amber-400">Devoluciones</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-emerald-400">Venta Neta</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-orange-400">Ganancia Real</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Margen</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Qué Vendió</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.userId}
                    onClick={() => handleOpenUserDetail(u)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                          #{u.userId}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-base group-hover:text-orange-400 transition-colors">
                            {u.fullName || u.userName || u.username}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">@{u.username}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300">
                              <Shield className="w-2.5 h-2.5 text-orange-400" />
                              {u.roleName || 'Usuario'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Receipt className="w-3.5 h-3.5" />
                        {u.ticketsCount}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-semibold text-white">
                      <div className="flex flex-col items-end">
                        <span>{formatQty(u.netQuantitySold)}</span>
                        {u.totalQuantityReturned > 0 && (
                          <span className="text-[11px] text-amber-400">
                            (Dev: -{formatQty(u.totalQuantityReturned)})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-medium text-gray-400">
                      {formatCurrency(u.grossSalesAmount)}
                    </td>

                    <td className="py-4 px-4 text-right font-medium text-amber-400">
                      {u.totalRefundedAmount > 0 ? `-${formatCurrency(u.totalRefundedAmount)}` : '-'}
                    </td>

                    <td className="py-4 px-4 text-right font-black text-white text-base">
                      {formatCurrency(u.netSalesAmount)}
                    </td>

                    <td className="py-4 px-4 text-right font-extrabold text-emerald-400 text-base">
                      +{formatCurrency(u.realProfitAmount)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="text-xs font-bold text-gray-300 bg-gray-800/80 px-2.5 py-1 rounded-lg">
                        {u.profitMarginPercent}%
                      </span>
                    </td>

                    <td
                      className="py-4 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenUserDetail(u);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenUserDetail(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/90 hover:bg-orange-500 text-gray-200 hover:text-white border border-gray-700 hover:border-orange-500 font-bold text-xs transition-all cursor-pointer shadow-sm"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Ver qué vendió
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 bg-[#141414]/90 font-extrabold text-white text-base">
                  <td className="py-4 px-4 rounded-bl-xl">TOTALES</td>
                  <td className="py-4 px-4 text-center text-purple-400">{data?.totalTicketsCount ?? 0}</td>
                  <td className="py-4 px-4 text-right">{formatQty(data?.totalQuantitySold)}</td>
                  <td className="py-4 px-4 text-right text-gray-400">{formatCurrency(data?.totalGrossSales)}</td>
                  <td className="py-4 px-4 text-right text-amber-400">-{formatCurrency(data?.totalRefundedAmount)}</td>
                  <td className="py-4 px-4 text-right text-emerald-400">{formatCurrency(data?.totalNetSales)}</td>
                  <td className="py-4 px-4 text-right text-orange-400">+{formatCurrency(data?.totalProfitAmount)}</td>
                  <td colSpan={2} className="py-4 px-4 rounded-br-xl"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal para inspeccionar productos y tickets de este usuario */}
      <UserSalesDetailModal
        isOpen={Boolean(selectedUser)}
        userSummary={selectedUser}
        detail={selectedUser ? detailsByUser[selectedUser.userId] ?? null : null}
        isLoading={
          Boolean(selectedUser) &&
          loadingDetailId === selectedUser?.userId &&
          !detailsByUser[selectedUser.userId]
        }
        error={detailError}
        onClose={() => setSelectedUser(null)}
        onRetry={() => {
          if (selectedUser) {
            fetchUserDetail(selectedUser, true);
          }
        }}
      />
    </div>
  );
};

export default UserSalesSection;
