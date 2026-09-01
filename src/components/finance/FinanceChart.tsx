// src/components/finance/FinanceChart.tsx
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { FinancialChartItem } from '../../types/finance';

interface FinanceChartProps {
  data: FinancialChartItem[];
}

const FinanceChart: React.FC<FinanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl">
        <p className="text-gray-500 font-medium text-lg">No hay datos para graficar en este periodo.</p>
      </div>
    );
  }

  // Formateador para el Tooltip
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  return (
    <div className="w-full h-[400px] bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-white font-bold text-lg mb-6">Flujo de Caja Neto por Día</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6b7280" 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#6b7280" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#121212', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              formatter={(value: number) => [formatCurrency(value), 'Ingreso Neto']}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="netAmount" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorNet)" 
              activeDot={{ r: 6, fill: '#10b981', stroke: '#121212', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceChart;