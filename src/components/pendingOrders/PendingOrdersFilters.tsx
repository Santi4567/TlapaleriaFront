// src/components/pendingOrders/PendingOrdersFilters.tsx
import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types/supplier';

export interface PendingFiltersState {
  search: string;
  supplierId: string;
  status: number;
  startDate: string;
  endDate: string;
}

interface PendingOrdersFiltersProps {
  suppliersList: Supplier[];
  onFiltersChange: (filters: PendingFiltersState) => void;
  isLoading: boolean;
}

const PendingOrdersFilters: React.FC<PendingOrdersFiltersProps> = ({ suppliersList, onFiltersChange, isLoading }) => {
  // ESTADO PARA CONTROLAR EL ACORDEÓN DE FILTROS SECUNDARIOS
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Estados locales
  const [dateMode, setDateMode] = useState<'day' | 'range'>('day');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localSupplierFilter, setLocalSupplierFilter] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('0');

  // Funciones de formateo de fecha
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, currentValue: string) => {
    const newValue = e.target.value;
    if (newValue.length < currentValue.length) { setter(newValue); return; }
    let rawValue = newValue.replace(/\D/g, ''); 
    if (rawValue.length > 8) rawValue = rawValue.substring(0, 8); 
    let formattedValue = rawValue;
    if (rawValue.length > 4) formattedValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2, 4)}/${rawValue.substring(4, 8)}`;
    else if (rawValue.length > 2) formattedValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2)}`;
    setter(formattedValue);
  };

  const formatDateForAPI = (dateStr: string) => {
    if (dateStr.length !== 10) return ''; 
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Notificar al componente padre cuando cambien los filtros
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onFiltersChange({
        search: localSearchTerm,
        supplierId: localSupplierFilter,
        status: Number(localStatusFilter),
        startDate: formatDateForAPI(localStartDate),
        endDate: dateMode === 'range' ? formatDateForAPI(localEndDate) : ''
      });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [localSearchTerm, localSupplierFilter, localStatusFilter, localStartDate, localEndDate, dateMode, onFiltersChange]);

  const handleClearFilters = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setLocalSearchTerm('');
    setLocalSupplierFilter('');
    setLocalStatusFilter('0');
    setDateMode('day');
  };

  return (
    <div className="p-5 border border-gray-800 bg-[#1a1a1a] rounded-2xl flex flex-col gap-5 mb-6 shadow-sm transition-all duration-300 ease-in-out">
      
      {/* Título de la sección */}
      <div>
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
          Búsqueda de Pedidos
        </h3>
      </div>
      
      {/* 1. Buscador Principal + Botón Toggle */}
      <div className="flex w-full gap-3 items-end">
        <div className="flex flex-col flex-1">
          <label className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Buscar Producto / Clave</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ej. Cemento, THW..." 
              value={localSearchTerm} 
              onChange={(e) => setLocalSearchTerm(e.target.value)} 
              className="w-full bg-[#121212] border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white focus:border-orange-500 outline-none placeholder-gray-600 transition-colors" 
            />
            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 h-[46px] ${
            showAdvancedFilters 
              ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_15px_rgba(255,90,0,0.2)]' 
              : 'bg-[#121212] text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          Filtros
        </button>
      </div>

      {/* 2. Filtros Secundarios (Se despliegan al hacer clic) */}
      {showAdvancedFilters && (
        <div className="flex flex-wrap items-end gap-4 border-t border-gray-800/50 pt-5 animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Proveedor */}
          <div className="flex flex-col flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Proveedor</label>
            <select value={localSupplierFilter} onChange={(e) => setLocalSupplierFilter(e.target.value)} className="bg-[#121212] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none w-full transition-colors" style={{ colorScheme: 'dark' }}>
              <option value="">Todos los proveedores</option>
              {suppliersList.map(sup => (<option key={sup.id} value={sup.id}>{sup.name}</option>))}
            </select>
          </div>

          {/* Estado */}
          <div className="flex flex-col flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Estado</label>
            <select value={localStatusFilter} onChange={(e) => setLocalStatusFilter(e.target.value)} className="bg-[#121212] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none w-full font-bold transition-colors" style={{ colorScheme: 'dark' }}>
              <option value="0" className="text-orange-400">⏳ Pendientes</option>
              <option value="2" className="text-green-400">✅ Completados</option>
              <option value="1" className="text-red-400">❌ Cancelados</option>
              <option value="-1" className="text-white">📋 Todos</option>
            </select>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-2 p-3 bg-[#121212] rounded-xl border border-gray-800">
            <div className="flex justify-between items-center gap-4">
              <div className="flex bg-[#1c1c1c] rounded-lg p-1 border border-gray-800 w-fit">
                <button type="button" onClick={() => { setDateMode('day'); setLocalEndDate(''); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${dateMode === 'day' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Día</button>
                <button type="button" onClick={() => setDateMode('range')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${dateMode === 'range' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Rango</button>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input type="text" value={localStartDate} onChange={(e) => handleDateInput(e, setLocalStartDate, localStartDate)} placeholder="DD/MM/AAAA" className="bg-[#1c1c1c] border border-gray-800 rounded-lg px-4 py-2 text-sm text-center text-white focus:border-orange-500 outline-none w-[150px] font-mono transition-colors" />
              {dateMode === 'range' && (
                <><span className="text-gray-600 font-bold">a</span><input type="text" value={localEndDate} onChange={(e) => handleDateInput(e, setLocalEndDate, localEndDate)} placeholder="DD/MM/AAAA" className="bg-[#1c1c1c] border border-gray-800 rounded-lg px-4 py-2 text-sm text-center text-white focus:border-orange-500 outline-none w-[150px] font-mono transition-colors" /></>
              )}
            </div>
          </div>

          {/* Botón Limpiar & Spinner */}
          <div className="flex gap-2 ml-auto mb-1">
            <button type="button" onClick={handleClearFilters} className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-xl transition-colors">
              Limpiar
            </button>
            <div className="w-12 flex items-center justify-center">
               {isLoading && <svg className="w-6 h-6 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PendingOrdersFilters;