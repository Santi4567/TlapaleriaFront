// src/pages/InvoicesScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleService } from '../services/saleService';
import InvoiceModal from '../components/invoice/InvoiceModal';
import { SaleTicketDetail } from '../types/finance';

const InvoicesScreen: React.FC = () => {
  const { user } = useAuth();

  const [sales, setSales] = useState<SaleTicketDetail[]>([]);
  const [searchFolio, setSearchFolio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Venta seleccionada para abrir el modal de facturación
  const [selectedSale, setSelectedSale] = useState<SaleTicketDetail | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSales = async (folioToSearch?: string) => {
    if (!user?.token) return;
    setIsLoading(true);

    const res = await saleService.getSales(user.token, folioToSearch, 1, 30);
    setIsLoading(false);

    if (res && res.success && res.data) {
      setSales(res.data.data || []);
    } else {
      setSales([]);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales(searchFolio);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      
      {/* NOTIFICACIÓN TOAST */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-brand-orange/50 px-6 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center space-x-3 text-white font-bold text-sm">
            <span className="text-brand-orange text-lg">ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-brand-orange/10 text-brand-orange rounded-2xl border border-brand-orange/20">
              🧾
            </span>
            Facturación Electrónica (CFDI 4.0)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Busca cualquier venta por número de ticket o folio para emitir su factura oficial timbrada ante el SAT
          </p>
        </div>

        {/* BUSCADOR POR FOLIO */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por folio de venta (ej: VEN-...)"
            value={searchFolio}
            onChange={(e) => setSearchFolio(e.target.value)}
            className="w-full md:w-72 bg-black/60 border border-gray-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-orange hover:bg-orange-500 text-brand-deep-dark font-black rounded-2xl transition-all shadow-[0_0_15px_rgba(255,90,0,0.3)] shrink-0 flex items-center gap-2 text-sm"
          >
            <span>🔍</span> Buscar
          </button>
          {searchFolio && (
            <button
              type="button"
              onClick={() => { setSearchFolio(''); fetchSales(''); }}
              className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-colors text-sm"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* TABLA DE VENTAS DISPONIBLES PARA FACTURAR */}
      <div className="flex-1 min-h-0 bg-black/40 rounded-2xl border border-gray-800/80 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#121212] text-xs uppercase font-mono text-gray-500 sticky top-0 border-b border-gray-800 z-10">
              <tr>
                <th className="py-3.5 px-6">Folio Ticket</th>
                <th className="py-3.5 px-6">Fecha y Hora</th>
                <th className="py-3.5 px-6">Cajero</th>
                <th className="py-3.5 px-6">Método de Pago</th>
                <th className="py-3.5 px-6 text-right">Total Cobrado</th>
                <th className="py-3.5 px-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <span className="inline-block animate-spin mr-2">⏳</span> Cargando ventas...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No se encontraron ventas para mostrar.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-6 font-bold text-brand-orange font-mono">
                      {sale.folio}
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      {new Date(sale.createdAt).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6 font-sans text-white">
                      {sale.user?.name || 'Desconocido'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg text-gray-300 font-sans text-[11px] font-bold">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-green-400 text-sm">
                      ${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-4 py-1.5 bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-brand-deep-dark font-black font-sans text-xs rounded-xl border border-brand-orange/40 transition-all shadow-[0_0_10px_rgba(255,90,0,0.1)]"
                      >
                        🧾 Facturar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE FACTURACIÓN */}
      {selectedSale && (
        <InvoiceModal
          saleId={selectedSale.id}
          folio={selectedSale.folio}
          totalAmount={selectedSale.totalAmount}
          onClose={() => setSelectedSale(null)}
          onSuccess={() => {
            showNotification(`¡Factura generada con éxito para la venta ${selectedSale.folio}!`);
          }}
        />
      )}

    </div>
  );
};

export default InvoicesScreen;
