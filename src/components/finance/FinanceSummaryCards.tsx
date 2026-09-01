// src/components/finance/FinanceSummaryCards.tsx
import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Receipt } from 'lucide-react';
import { FinancialReportData } from '../../types/finance';

interface FinanceSummaryCardsProps {
  data: FinancialReportData;
}

const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({ data }) => {
  // Función auxiliar pura para formatear a moneda
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      
      {/* Tarjeta: Ventas Brutas */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Ventas Brutas</h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">{formatCurrency(data.grossSalesAmount)}</p>
          <p className="text-xs text-gray-500 mt-2">Antes de devoluciones</p>
        </div>
      </div>

      {/* Tarjeta: Devoluciones */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Devoluciones</h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">{formatCurrency(data.totalRefundedAmount)}</p>
          <p className="text-xs text-gray-500 mt-2">Mermas y garantías</p>
        </div>
      </div>

      {/* Tarjeta: Ventas Netas (Destacada con el color de la marca/éxito) */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_4px_20px_rgba(16,185,129,0.1)] flex flex-col justify-between relative overflow-hidden">
        {/* Efecto Glassmórfico de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Ventas Netas</h3>
        </div>
        <div className="relative z-10">
          <p className="text-4xl font-black text-white">{formatCurrency(data.netSalesAmount)}</p>
          <p className="text-xs text-emerald-500/70 mt-2 font-medium">Ingreso real a caja</p>
        </div>
      </div>

      {/* Tarjeta: Tickets Totales */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Receipt className="w-5 h-5 text-brand-orange text-orange-500" />
          </div>
          <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Tickets Activos</h3>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-white">{data.totalSalesCount}</p>
          <p className="text-xs text-gray-500 mt-2">Operaciones en el periodo</p>
        </div>
      </div>

    </div>
  );
};

export default FinanceSummaryCards;