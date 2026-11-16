// src/components/finance/FinanceSummaryCards.tsx
import React from 'react';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  PackageOpen,
  Award,
  HandCoins,
  Clock,
} from 'lucide-react';
import { FinancialReportData } from '../../types/finance';

interface FinanceSummaryCardsProps {
  data: FinancialReportData;
}

const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({ data }) => {
  // Función auxiliar pura para formatear a moneda
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* Tarjeta 1: Ventas Brutas */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
            Ventas Brutas
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(data.grossSalesAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Contado + abonos antes de devoluciones
          </p>
        </div>
      </div>

      {/* Tarjeta 2: Devoluciones */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
            Devoluciones
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(data.totalRefundedAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Reembolsos salidos de caja</p>
        </div>
      </div>

      {/* Tarjeta 3: Ventas Netas */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
            Ventas Netas
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(data.netSalesAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Ingreso real en caja</p>
        </div>
      </div>

      {/* Tarjeta 4: Costo de Ventas (Inversión / Proveedor) */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <PackageOpen className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
            Costo de Proveedor
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(data.costOfGoodsSold)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Costo de mercancía cobrada
          </p>
        </div>
      </div>

      {/* Tarjeta 5: Ganancia Real */}
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
          <p className="text-4xl font-black text-white">
            {formatCurrency(data.realProfitAmount)}
          </p>
          <p className="text-xs text-orange-500/70 mt-2 font-medium">
            Tu utilidad neta libre cobrada
          </p>
        </div>
      </div>

      {/* Tarjeta 6: Abonos de Crédito Cobrados */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-teal-500/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-500/30">
            <HandCoins className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-teal-400 font-semibold text-sm uppercase tracking-wider">
            Abonos Cobrados
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(data.creditPaymentsCollectedAmount ?? 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Anticipos y pagos de cuentas en el periodo
          </p>
        </div>
      </div>

      {/* Tarjeta 7: Saldo Pendiente por Cobrar */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-yellow-500/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center border border-yellow-500/30">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-yellow-400 font-semibold text-sm uppercase tracking-wider">
            Saldo por Cobrar
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {formatCurrency(data.pendingCreditSalesAmount ?? 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Crédito aún pendiente de este periodo
          </p>
        </div>
      </div>

      {/* Tarjeta 8: Tickets Totales */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Receipt className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
            Tickets Activos
          </h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">
            {data.totalSalesCount}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Operaciones registradas en el periodo
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinanceSummaryCards;
