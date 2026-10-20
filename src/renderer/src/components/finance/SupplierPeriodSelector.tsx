// src/components/finance/SupplierPeriodSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, CalendarDays, CalendarRange, Infinity as InfinityIcon, 
  ChevronLeft, ChevronRight, ChevronDown 
} from 'lucide-react';
import { SupplierReportPeriod } from '../../types/report';
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

export interface SupplierFilterParams {
  periodType: SupplierReportPeriod;
  startDate?: string;
  endDate?: string;
}

interface SupplierPeriodSelectorProps {
  onFilterChange: (params: SupplierFilterParams) => void;
}

const SupplierPeriodSelector: React.FC<SupplierPeriodSelectorProps> = ({ onFilterChange }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const firstDay = formatLocalDate(new Date(currentYear, today.getMonth(), 1));
  const currentDay = formatLocalDate(today);

  const [periodType, setPeriodType] = useState<SupplierReportPeriod>(SupplierReportPeriod.Day);
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [startDate, setStartDate] = useState<string>(firstDay);
  const [endDate, setEndDate] = useState<string>(currentDay);

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [viewYear, setViewYear] = useState(currentYear);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const availableYears = Array.from({ length: 6 }, (_, idx) => currentYear - idx);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) setIsMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setIsYearOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let queryStart: string | undefined = undefined;
    let queryEnd: string | undefined = undefined;

    if (periodType === SupplierReportPeriod.Day || periodType === SupplierReportPeriod.Week) {
      queryStart = selectedDay || currentDay;
    } else if (periodType === SupplierReportPeriod.Month) {
      const monthStr = String(selectedMonth).padStart(2, '0');
      queryStart = `${selectedYear}-${monthStr}-01`;
    } else if (periodType === SupplierReportPeriod.Year) {
      queryStart = `${selectedYear}-01-01`;
    } else if (periodType === SupplierReportPeriod.CustomRange) {
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

  const currentMonthName = MESES.find((m) => m.value === selectedMonth)?.label || '';

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
      {/* Botonera: HOY | SEMANA | MES | AÑO | RANGO | TODO */}
      <div className="flex flex-wrap items-center bg-[#1a1a1a]/90 p-1.5 rounded-2xl border border-gray-800 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setPeriodType(SupplierReportPeriod.Day);
            setSelectedDay(currentDay);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === SupplierReportPeriod.Day
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
            setPeriodType(SupplierReportPeriod.Week);
            setSelectedDay(currentDay);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === SupplierReportPeriod.Week
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Semana
        </button>

        <button
          type="button"
          onClick={() => {
            setPeriodType(SupplierReportPeriod.Month);
            setSelectedMonth(currentMonth);
            setSelectedYear(currentYear);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === SupplierReportPeriod.Month
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
            setPeriodType(SupplierReportPeriod.Year);
            setSelectedYear(currentYear);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === SupplierReportPeriod.Year
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Año
        </button>

        <button
          type="button"
          onClick={() => setPeriodType(SupplierReportPeriod.CustomRange)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === SupplierReportPeriod.CustomRange
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          Rango
        </button>

        <button
          type="button"
          onClick={() => setPeriodType(SupplierReportPeriod.AllTime)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
            periodType === SupplierReportPeriod.AllTime
              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <InfinityIcon className="w-4 h-4" />
          Todo
        </button>
      </div>

      {/* Selector Contextual según el botón */}
      {periodType !== SupplierReportPeriod.AllTime && (
        <div className="flex items-center gap-3 bg-[#1a1a1a]/80 backdrop-blur-md p-2 rounded-2xl border border-gray-800 shadow-sm">
          {(periodType === SupplierReportPeriod.Day || periodType === SupplierReportPeriod.Week) && (
            <div className="flex items-center gap-3 px-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {periodType === SupplierReportPeriod.Day ? 'Día:' : 'Semana de:'}
              </span>
              <CustomDatePicker 
                selected={parseLocalDate(selectedDay)} 
                onChange={(date) => setSelectedDay(date ? formatLocalDate(date) : currentDay)} 
              />
            </div>
          )}

          {periodType === SupplierReportPeriod.Month && (
            <div className="flex items-center gap-3 px-2 relative" ref={monthRef}>
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mes:</span>
              <button
                type="button"
                onClick={() => setIsMonthOpen(!isMonthOpen)}
                className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-[#121212] border border-orange-500/60 hover:border-orange-500 text-sm font-semibold text-white min-w-[165px]"
              >
                <span>{currentMonthName} {selectedYear}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isMonthOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[#181818] border border-gray-800 rounded-2xl p-4 shadow-2xl z-[100]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                    <button type="button" onClick={() => setViewYear((p) => p - 1)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold text-sm">{viewYear}</span>
                    <button
                      type="button"
                      disabled={viewYear >= currentYear}
                      onClick={() => setViewYear((p) => Math.min(currentYear, p + 1))}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {MESES.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          setSelectedMonth(m.value);
                          setSelectedYear(viewYear);
                          setIsMonthOpen(false);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          m.value === selectedMonth && viewYear === selectedYear
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {m.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {periodType === SupplierReportPeriod.Year && (
            <div className="flex items-center gap-3 px-2 relative" ref={yearRef}>
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Año:</span>
              <button
                type="button"
                onClick={() => setIsYearOpen(!isYearOpen)}
                className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-[#121212] border border-orange-500/60 hover:border-orange-500 text-sm font-semibold text-white min-w-[115px]"
              >
                <span>{selectedYear}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isYearOpen && (
                <div className="absolute right-0 top-12 w-48 bg-[#181818] border border-gray-800 rounded-2xl p-3 shadow-2xl z-[100]">
                  <div className="grid grid-cols-2 gap-2">
                    {availableYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearOpen(false);
                        }}
                        className={`py-2 rounded-xl text-sm font-bold transition-all ${
                          y === selectedYear ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {periodType === SupplierReportPeriod.CustomRange && (
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
      )}
    </div>
  );
};

export default SupplierPeriodSelector;