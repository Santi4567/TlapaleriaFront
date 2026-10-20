// src/components/finance/SupplierSalesSection.tsx
import React, { useState } from 'react';
import { Truck, DollarSign, Award, Receipt, Search, PackageCheck } from 'lucide-react';
import { SupplierSalesReportResponse } from '../../types/report';

interface SupplierSalesSectionProps {
  data: SupplierSalesReportResponse;
}

const SupplierSalesSection: React.FC<SupplierSalesSectionProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const filteredSuppliers = data.suppliers.filter((s) =>
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      {/* 3 Tarjetas de Resumen para Separar el Dinero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta Principal: Dinero a Separar para Proveedores */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-amber-500/40 rounded-2xl p-6 shadow-[0_4px_20px_rgba(245,158,11,0.1)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">
              Dinero de Proveedores
            </h3>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-white">{formatCurrency(data.totalSupplierAmount)}</p>
            <p className="text-xs text-amber-500/80 mt-2 font-medium">
              Monto total que debes separar para reponer mercancía
            </p>
          </div>
        </div>

        {/* Tarjeta: Total Cobrado a Clientes */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
              Total Cobrado (Neto)
            </h3>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(data.totalChargedClient)}</p>
            <p className="text-xs text-gray-500 mt-2">Dinero real en caja (descontando devoluciones)</p>
          </div>
        </div>

        {/* Tarjeta: Tu Ganancia Libre */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-orange-500/30 rounded-2xl p-6 shadow-[0_4px_20px_rgba(249,115,22,0.1)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/40">
              <Award className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-orange-400 font-bold text-sm uppercase tracking-wider">
              Tu Ganancia Libre
            </h3>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-white">{formatCurrency(data.totalProfitAmount)}</p>
            <p className="text-xs text-orange-500/70 mt-2 font-medium">
              Utilidad libre después de separar lo de los proveedores
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Desglosada por Proveedor */}
      <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-orange-500" />
              Desglose por Proveedor ({filteredSuppliers.length})
            </h3>
            <p className="text-gray-400 text-sm mt-0.5">
              Separa en sobres o cuentas el monto indicado en la columna "Apartar a Proveedor".
            </p>
          </div>

          {/* Buscador de proveedor */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-gray-800 focus:border-orange-500 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>
        </div>

        {filteredSuppliers.length === 0 ? (
          <div className="h-60 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl">
            <Truck className="w-10 h-10 text-gray-600 mb-2" />
            <p className="text-gray-500 font-medium text-base">
              No hay ventas registradas para proveedores en este periodo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Tickets Efectivos</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-amber-400">Apartar a Proveedor</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Cobrado al Cliente</th>
                  <th className="py-3.5 px-4 font-semibold text-right text-orange-400">Tu Ganancia</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {filteredSuppliers.map((sup) => {
                  const marginPercent =
                    sup.totalChargedClient > 0
                      ? ((sup.profitAmount / sup.totalChargedClient) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr
                      key={sup.supplierId}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                            #{sup.supplierId}
                          </div>
                          <span className="font-bold text-white text-base group-hover:text-orange-400 transition-colors">
                            {sup.supplierName}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Receipt className="w-3.5 h-3.5" />
                          {sup.effectiveTickets}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-base">
                          {formatCurrency(sup.supplierAmount)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-gray-200 text-base">
                        {formatCurrency(sup.totalChargedClient)}
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-emerald-400 text-base">
                        +{formatCurrency(sup.profitAmount)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="text-xs font-bold text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-lg">
                          {marginPercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 bg-[#141414]/90 font-extrabold text-white text-base">
                  <td className="py-4 px-4 rounded-bl-xl">TOTALES</td>
                  <td className="py-4 px-4 text-center text-gray-400">-</td>
                  <td className="py-4 px-4 text-right text-amber-400">
                    {formatCurrency(
                      filteredSuppliers.reduce((acc, x) => acc + x.supplierAmount, 0)
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatCurrency(
                      filteredSuppliers.reduce((acc, x) => acc + x.totalChargedClient, 0)
                    )}
                  </td>
                  <td className="py-4 px-4 text-right text-emerald-400">
                    +{formatCurrency(
                      filteredSuppliers.reduce((acc, x) => acc + x.profitAmount, 0)
                    )}
                  </td>
                  <td className="py-4 px-4 rounded-br-xl"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierSalesSection;