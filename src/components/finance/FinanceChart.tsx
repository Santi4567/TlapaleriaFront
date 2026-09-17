// src/components/finance/FinanceChart.tsx
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
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

  // Formateador para el Tooltip y ejes
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  return (
    <div className="w-full h-[420px] bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-white font-bold text-lg mb-6">Comportamiento Diario (Ventas vs Ganancia Real)</h3>
      <div className="w-full h-[310px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Gradiente para Ventas Netas */}
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              {/* Gradiente para Ganancia Real */}
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
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
              formatter={(value: any, name: string) => [
                formatCurrency(Number(value) || 0), 
                name === 'netAmount' ? 'Venta Neta' : 'Ganancia Real'
              ]}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              formatter={(value) => <span className="text-gray-300 text-sm font-medium">{value === 'netAmount' ? 'Ventas Netas' : 'Ganancia Real'}</span>}
            />
            <Area 
              type="monotone" 
              dataKey="netAmount" 
              name="netAmount"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorNet)" 
            />
            <Area 
              type="monotone" 
              dataKey="realProfitAmount" 
              name="realProfitAmount"
              stroke="#f97316" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorProfit)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceChart;