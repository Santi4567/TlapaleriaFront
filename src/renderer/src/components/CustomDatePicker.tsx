// src/components/ui/CustomDatePicker.tsx
import React, { useState, useRef, useEffect } from 'react';

interface Props {
  label?: string; // Ahora es opcional
  value: string; // Formato YYYY-MM-DD o cadena vacía ''
  onChange: (date: string) => void;
  placeholder?: string;
}

const CustomDatePicker: React.FC<Props> = ({ label, value, onChange, placeholder = "DD/MM/AAAA" }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Si está vacío, usamos la fecha de hoy como referencia para el calendario
  const parseDate = (str: string) => {
    if (!str) return new Date(); 
    const [y, m, d] = str.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const [currentViewDate, setCurrentViewDate] = useState(() => parseDate(value));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentViewDate(parseDate(value));
  }, [value]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 

  const handlePrevMonth = () => setCurrentViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentViewDate(new Date(year, month + 1, 1));

  const handleSelectDay = (day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="relative" ref={popoverRef}>
      {label && (
        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      <button
        type="button" // Previene que envíe formularios accidentalmente
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#1c1c1c] border border-gray-800 rounded-lg px-4 py-2 w-[150px] h-[38px] flex items-center justify-between hover:border-brand-orange focus:border-brand-orange focus:outline-none transition-colors ${!value ? 'text-gray-500' : 'text-white'}`}
      >
        <span className="font-mono text-sm">
          {value ? value.split('-').reverse().join('/') : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>
            <span className="text-white font-bold text-sm">{monthNames[month]} {year}</span>
            <button type="button" onClick={handleNextMonth} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => <div key={day} className="text-center text-xs font-bold text-gray-500">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map(i => <div key={`empty-${i}`} />)}
            {monthDays.map(day => {
              const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = currentDateStr === value;
              const isToday = currentDateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 rounded flex items-center justify-center text-sm transition-colors ${
                    isSelected ? 'bg-orange-500 text-black font-extrabold shadow-md' : isToday ? 'bg-gray-800 text-orange-500 font-bold border border-orange-500/30' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;