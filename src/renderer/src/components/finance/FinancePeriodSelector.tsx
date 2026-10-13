// src/components/finance/FinancePeriodSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, ChevronDown 
} from 'lucide-react';
import { FinancialReportPeriod } from '../../types/finance';
import CustomDatePicker from '../CustomDatePicker';

const MESES = [
  { value: 1, short: 'Ene', label: 'Enero' },
  { value: 2, short: 'Feb', label: 'Febrero' },
  { value: 3, short: 'Mar', label: 'Marzo' },
  { value: 4, short: 'Abr', label: 'Abril' },
  { value: 5, short: 'May', label: 'Mayo' },
  { value: 6, short: 'Jun', label: 'Junio' },
  { value: 7, short: 'Jul', label: 'Julio' },
  { value: 8, short: 'Ago', label: 'Agosto' },
  { value: 9, short: 'Sep', label: 'Septiembre' },
  { value: 10, short: 'Oct', label: 'Octubre' },
  { value: 11, short: 'Nov', label: 'Noviembre' },
  { value: 12, short: 'Dic', label: 'Diciembre' },
];

// Funciones auxiliares de fecha local
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// --- Subcomponente: Popover de Mes y Año ---
interface MonthYearPickerProps {
  month: number;
  year: number;
  maxYear: number;
  onChange: (newMonth: number, newYear: number) => void;
}

const CustomMonthYearPicker: React.FC<MonthYearPickerProps> = ({ month, year, maxYear, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewYear(year);
  }, [year]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMonthName = MESES.find((m) => m.value === month)?.label || '';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-[#121212] border text-sm font-semibold text-white transition-all min-w-[165px] ${
          isOpen ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'border-orange-500/60 hover:border-orange-500'
        }`}
      >
        <span>{currentMonthName} {year}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#181818] border border-gray-800 rounded-2xl p-4 shadow-2xl z-[100] animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
            <button
              type="button"
              onClick={() => setViewYear((prev) => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-sm tracking-wide">{viewYear}</span>
            <button
              type="button"
              disabled={viewYear >= maxYear}
              onClick={() => setViewYear((prev) => Math.min(maxYear, prev + 1))}
              className={`p-1.5 rounded-lg transition-colors ${
                viewYear >= maxYear ? 'text-gray-700 cursor-not-allowed' : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MESES.map((m) => {
              const isSelected = m.value === month && viewYear === year;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    onChange(m.value, viewYear);
                    setIsOpen(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {m.short}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponente: Popover de Año ---
interface YearPickerProps {
  year: number;
  availableYears: number[];
  onChange: (newYear: number) => void;
}

const CustomYearPicker: React.FC<YearPickerProps> = ({ year, availableYears, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-[#121212] border text-sm font-semibold text-white transition-all min-w-[115px] ${
          isOpen ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'border-orange-500/60 hover:border-orange-500'
        }`}
      >
        <span>{year}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#181818] border border-gray-800 rounded-2xl p-3 shadow-2xl z-[100] animate-fade-in-up">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1 text-center border-b border-gray-800 pb-2">
            Seleccionar Año
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableYears.map((y) => {
              const isSelected = y === year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(y);
                    setIsOpen(false);
                  }}
                  className={`py-2 rounded-xl text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL EXPORTADO ---
export interface FinanceFilterParams {
  periodType: FinancialReportPeriod;
  startDate?: string;
  endDate?: string;
}

interface FinancePeriodSelectorProps {
  onFilterChange: (params: FinanceFilterParams) => void;
}

const FinancePeriodSelector: React.FC<FinancePeriodSelectorProps> = ({ onFilterChange }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const firstDay = formatLocalDate(new Date(currentYear, today.getMonth(), 1));
  const currentDay = formatLocalDate(today);

  const [periodType, setPeriodType] = useState<FinancialReportPeriod>(FinancialReportPeriod.Day);
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [startDate, setStartDate] = useState<string>(firstDay);
  const [endDate, setEndDate] = useState<string>(currentDay);

  const availableYears = Array.from({ length: 6 }, (_, idx) => currentYear - idx);

  // Cada vez que cambia la selección, calcula los parámetros exactos para la API y avisa al padre
  useEffect(() => {
    let queryStart: string | undefined = undefined;
    let queryEnd: string | undefined = undefined;

    if (periodType === FinancialReportPeriod.Day) {
      queryStart = selectedDay || currentDay;
    } else if (periodType === FinancialReportPeriod.Month) {
      const monthStr = String(selectedMonth).padStart(2, '0');
      queryStart = `${selectedYear}-${monthStr}-01`;
    } else if (periodType === FinancialReportPeriod.Year) {
      queryStart = `${selectedYear}-01-01`;
    } else {
      queryStart = startDate;
      queryEnd = endDate;
    }

    onFilterChange({
      periodType,
      startDate: queryStart,
      endDate: queryEnd,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, selectedDay, selectedMonth, selectedYear, startDate, endDate]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
      
      {/* Botonera: HOY | MES | AÑO | RANGO */}
      <div className="flex items-center bg-[#1a1a1a]/90 p-1.5 rounded-2xl border border-gray-800 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setPeriodType(FinancialReportPeriod.Day);
            setSelectedDay(currentDay);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === FinancialReportPeriod.Day
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          Hoy
        </button>

        <button
          type="button"
          onClick={() => {
            setPeriodType(FinancialReportPeriod.Month);
            setSelectedMonth(currentMonth);
            setSelectedYear(currentYear);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === FinancialReportPeriod.Month
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Mes
        </button>

        <button
          type="button"
          onClick={() => {
            setPeriodType(FinancialReportPeriod.Year);
            setSelectedYear(currentYear);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === FinancialReportPeriod.Year
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Año
        </button>

        <button
          type="button"
          onClick={() => setPeriodType(FinancialReportPeriod.CustomRange)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === FinancialReportPeriod.CustomRange
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          Rango
        </button>
      </div>

      {/* Selector Contextual */}
      <div className="flex items-center gap-3 bg-[#1a1a1a]/80 backdrop-blur-md p-2 rounded-2xl border border-gray-800 shadow-sm mr-12">
        
        {/* 1. Modo HOY / Día */}
        {periodType === FinancialReportPeriod.Day && (
          <div className="flex items-center gap-3 px-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Día:</span>
            <CustomDatePicker 
              selected={parseLocalDate(selectedDay)} 
              onChange={(date) => setSelectedDay(date ? formatLocalDate(date) : currentDay)} 
            />
          </div>
        )}

        {/* 2. Modo MES */}
        {periodType === FinancialReportPeriod.Month && (
          <div className="flex items-center gap-3 px-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mes:</span>
            <CustomMonthYearPicker
              month={selectedMonth}
              year={selectedYear}
              maxYear={currentYear}
              onChange={(newM, newY) => {
                setSelectedMonth(newM);
                setSelectedYear(newY);
              }}
            />
          </div>
        )}

        {/* 3. Modo AÑO */}
        {periodType === FinancialReportPeriod.Year && (
          <div className="flex items-center gap-3 px-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Año:</span>
            <CustomYearPicker
              year={selectedYear}
              availableYears={availableYears}
              onChange={(newY) => setSelectedYear(newY)}
            />
          </div>
        )}

        {/* 4. Modo RANGO */}
        {periodType === FinancialReportPeriod.CustomRange && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <CustomDatePicker 
                selected={parseLocalDate(startDate)} 
                onChange={(date) => setStartDate(date ? formatLocalDate(date) : '')} 
              />
            </div>
            <span className="text-gray-600 font-bold">-</span>
            <div className="flex items-center gap-2 px-2">
              <CustomDatePicker 
                selected={parseLocalDate(endDate)} 
                onChange={(date) => setEndDate(date ? formatLocalDate(date) : '')} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinancePeriodSelector;