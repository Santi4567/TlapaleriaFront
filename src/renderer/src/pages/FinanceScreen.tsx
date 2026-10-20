// src/pages/FinanceScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Loader2, BarChart3, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { financeService } from '../services/financeService';
import { reportService } from '../services/reportService';
import { FinancialReportData, FinancialReportPeriod } from '../types/finance';
import { SupplierReportPeriod, SupplierSalesReportResponse } from '../types/report';
import StatusAlert from '../components/StatusAlert';
import FinanceSummaryCards from '../components/finance/FinanceSummaryCards';
import FinanceChart from '../components/finance/FinanceChart';
import FinancePeriodSelector, { FinanceFilterParams } from '../components/finance/FinancePeriodSelector';
import SupplierPeriodSelector, { SupplierFilterParams } from '../components/finance/SupplierPeriodSelector';
import SupplierSalesSection from '../components/finance/SupplierSalesSection';

type FinanceTab = 'general' | 'suppliers';

const FinanceScreen: React.FC = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<FinanceTab>('general');

  // Estados de Finanzas Generales
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(true);
  const [generalFilter, setGeneralFilter] = useState<FinanceFilterParams>({
    periodType: FinancialReportPeriod.Day,
  });

  // Estados de Corte por Proveedor
  const [supplierReportData, setSupplierReportData] = useState<SupplierSalesReportResponse | null>(null);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilterParams>({
    periodType: SupplierReportPeriod.Day,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGeneralFilterChange = useCallback((newFilter: FinanceFilterParams) => {
    setGeneralFilter(newFilter);
  }, []);

  const handleSupplierFilterChange = useCallback((newFilter: SupplierFilterParams) => {
    setSupplierFilter(newFilter);
  }, []);

  // Efecto para cargar el reporte general cuando cambia su filtro
  useEffect(() => {
    const fetchGeneralReport = async () => {
      if (!user?.token) return;
      setIsLoadingGeneral(true);
      setErrorMsg(null);
      
      const response = await financeService.getFinancialReport(
        user.token, 
        generalFilter.startDate, 
        generalFilter.endDate, 
        generalFilter.periodType
      );
      
      if (response && response.success) {
        setReportData(response.data);
      } else {
        setErrorMsg(response?.message || "No se pudo conectar con el servidor para obtener el reporte financiero.");
      }
      setIsLoadingGeneral(false);
    };

    fetchGeneralReport();
  }, [generalFilter, user?.token]);

  // Efecto para cargar el reporte por proveedor cuando cambia su filtro
  useEffect(() => {
    const fetchSupplierReport = async () => {
      if (!user?.token) return;
      setIsLoadingSuppliers(true);
      setErrorMsg(null);

      const response = await reportService.getSupplierSalesReport(
        user.token,
        supplierFilter.periodType,
        supplierFilter.startDate,
        supplierFilter.endDate
      );

      if (response && response.success) {
        setSupplierReportData(response.data);
      } else {
        setErrorMsg(response?.message || "No se pudo obtener el corte por proveedor.");
      }
      setIsLoadingSuppliers(false);
    };

    fetchSupplierReport();
  }, [supplierFilter, user?.token]);

  const isLoading = activeTab === 'general' ? isLoadingGeneral : isLoadingSuppliers;

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar relative">
      
      {/* Alertas */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[100] pointer-events-auto flex flex-col gap-2">
        {errorMsg && (
          <StatusAlert 
            success={false} 
            message={errorMsg} 
            onClose={() => setErrorMsg(null)} 
          />
        )}
      </div>

      {/* Encabezado + Pestañas + Selector de Periodo */}
      <div className="flex flex-col gap-6 mb-8 relative z-[60]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
              <Wallet className="w-10 h-10 text-orange-500" />
              Finanzas
            </h2>
            <p className="text-gray-400 text-lg mt-1">
              {activeTab === 'general'
                ? 'Reporte de ventas netas, devoluciones y flujo de caja.'
                : 'Separación de dinero por proveedor para reposición de mercancía.'}
            </p>
          </div>

          {/* Switch de Pestañas: Flujo de Caja vs Corte por Proveedor */}
          <div className="flex items-center bg-[#1a1a1a] p-1.5 rounded-2xl border border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Flujo de Caja
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              Corte por Proveedor
            </button>
          </div>
        </div>

        {/* Ambos selectores permanecen montados y con espacio a la derecha para que no se corte el calendario */}
        <div className="flex justify-end w-full pr-16">
          <div className={activeTab === 'general' ? 'block w-full xl:w-auto' : 'hidden'}>
            <FinancePeriodSelector onFilterChange={handleGeneralFilterChange} />
          </div>
          <div className={activeTab === 'suppliers' ? 'block w-full xl:w-auto' : 'hidden'}>
            <SupplierPeriodSelector onFilterChange={handleSupplierFilterChange} />
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 w-full flex flex-col relative">
        {isLoading ? (
          <div className="flex-1 w-full flex flex-col animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[140px] bg-[#1a1a1a]/60 border border-gray-800/50 rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-800/80"></div>
                    <div className="h-4 bg-gray-800/80 rounded w-24"></div>
                  </div>
                  <div>
                    <div className="h-8 bg-gray-800/80 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-800/80 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full h-[400px] bg-[#1a1a1a]/60 border border-gray-800/50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <Loader2 className="w-12 h-12 text-orange-500/50 animate-spin absolute" />
              <div className="w-full h-full bg-gradient-to-t from-gray-800/10 to-transparent"></div>
            </div>
          </div>
        ) : activeTab === 'general' && reportData ? (
          <div className="animate-fade-in-up">
            <FinanceSummaryCards data={reportData} />
            <FinanceChart data={reportData.chartData} periodType={generalFilter.periodType} />
          </div>
        ) : activeTab === 'suppliers' && supplierReportData ? (
          <SupplierSalesSection data={supplierReportData} />
        ) : null}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default FinanceScreen;