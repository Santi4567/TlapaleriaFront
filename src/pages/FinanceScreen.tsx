// src/pages/FinanceScreen.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { financeService } from '../services/financeService';
import { FinancialReportData } from '../types/finance';
import StatusAlert from '../components/StatusAlert';
import FinanceSummaryCards from '../components/finance/FinanceSummaryCards';
import FinanceChart from '../components/finance/FinanceChart';

const FinanceScreen: React.FC = () => {
  const { user } = useAuth();
  
  // Estados de datos y UI
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para las alertas flotantes
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Estados para los filtros de fecha (Por defecto mes actual)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const currentDay = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(currentDay);

  const fetchReport = async (isFirstLoad: boolean = false) => {
    if (!user?.token) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null); // Limpiamos alertas previas
    
    const response = await financeService.getFinancialReport(user.token, startDate, endDate);
    
    if (response && response.success) {
      setReportData(response.data);
      // Solo mostramos el mensaje de éxito si es una recarga por cambio de fecha manual
      if (!isFirstLoad) {
        setSuccessMsg("Reporte financiero actualizado correctamente.");
      }
    } else {
      setErrorMsg(response?.message || "No se pudo conectar con el servidor para obtener el reporte.");
    }
    
    setIsLoading(false);
  };

  // Cargar datos al montar y al cambiar las fechas
  useEffect(() => {
    // Detectamos si es la carga inicial comprobando si reportData es null
    const isFirstLoad = reportData === null;
    fetchReport(isFirstLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, user?.token]);

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col overflow-y-auto custom-scrollbar relative">
      
      {/* SISTEMA DE ALERTAS FLOTANTES (Absolute y z-50 para estar por encima de todo) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto flex flex-col gap-2">
        {errorMsg && (
          <StatusAlert 
            success={false} 
            message={errorMsg} 
            onClose={() => setErrorMsg(null)} 
          />
        )}
        {successMsg && (
          <StatusAlert 
            success={true} 
            message={successMsg} 
            onClose={() => setSuccessMsg(null)} 
          />
        )}
      </div>

      {/* Encabezado y Filtros */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Wallet className="w-10 h-10 text-brand-orange text-orange-500" />
            Finanzas
          </h2>
          <p className="text-gray-400 text-lg mt-1">
            Reporte de ventas netas, devoluciones y flujo de caja.
          </p>
        </div>

        {/* Controles de Fecha con diseño Glassmórfico */}
        <div className="flex items-center gap-4 bg-[#1a1a1a]/80 backdrop-blur-md p-2 rounded-2xl border border-gray-800 shadow-sm transition-colors focus-within:border-gray-600">
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white border-none focus:ring-0 text-sm font-medium outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
          <span className="text-gray-600 font-bold">-</span>
          <div className="flex items-center gap-2 px-3">
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white border-none focus:ring-0 text-sm font-medium outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 w-full flex flex-col relative">
        {isLoading ? (
          // SKELETON LOADING: Animación mientras se procesa la información
          <div className="flex-1 w-full flex flex-col animate-pulse">
            
            {/* Skeletons para las 4 tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
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

            {/* Skeleton para la Gráfica */}
            <div className="w-full h-[400px] bg-[#1a1a1a]/60 border border-gray-800/50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <Loader2 className="w-12 h-12 text-orange-500/50 animate-spin absolute" />
              <div className="w-full h-full bg-gradient-to-t from-gray-800/10 to-transparent"></div>
            </div>

          </div>
        ) : reportData ? (
          // DATOS CARGADOS CON ÉXITO
          <div className="animate-fade-in-up">
            <FinanceSummaryCards data={reportData} />
            <FinanceChart data={reportData.chartData} />
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

    </div>
  );
};

export default FinanceScreen;