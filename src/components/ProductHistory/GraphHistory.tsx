// src/components/ProductHistory/GraphHistory.tsx
import React, { useState, useEffect } from 'react';
import { Product, ProductPresentation } from '../../types/product';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  product: Product;
  presentation: ProductPresentation;
}

const getIsoDate = (date: Date) => date.toISOString().split('T')[0];

type ViewMode = 'separado' | 'junto';

const GraphHistory: React.FC<Props> = ({ product, presentation }) => {
  const [startDate, setStartDate] = useState(() => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    return getIsoDate(lastYear);
  });
  
  const [endDate, setEndDate] = useState(() => getIsoDate(new Date()));
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('separado');

  const fetchGraphData = async () => {
    setIsLoading(true);
    
    // MOCK DATA: Simulamos volatilidad (picos y caídas)
    setTimeout(() => {
      const dates = [
        '2025-09-17', '2025-10-15', '2025-11-20', '2025-12-10', 
        '2026-01-15', '2026-02-28', '2026-04-10', '2026-05-20', 
        '2026-07-01', '2026-08-15', '2026-09-17'
      ];
      
      const mockData = dates.map((date, index) => {
        const dataPoint: any = { date };
        
        product.presentations.forEach(p => {
          // Simulamos volatilidad: Sube, tiene un pico alto, cae, y vuelve a subir
          let factor = 1;
          if (index === 2) factor = 1.15; // Sube 15%
          if (index === 4) factor = 1.45; // PICO MÁXIMO (Sube 45%)
          if (index === 6) factor = 0.90; // Cae por debajo del original (-10%)
          if (index === 10) factor = 1.20; // Termina en +20%

          dataPoint[`price_${p.id}`] = p.price * factor;
          dataPoint[`cost_${p.id}`] = p.supplierPrice * factor;
        });
        
        return dataPoint;
      });

      setHistoryData(mockData);
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchGraphData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]); 

  const currentPriceKey = `price_${presentation.id}`;
  const currentCostKey = `cost_${presentation.id}`;
  const hasChanges = historyData.length > 1 && historyData.some(
    d => d[currentPriceKey] !== historyData[0][currentPriceKey] || d[currentCostKey] !== historyData[0][currentCostKey]
  );

  // === CÁLCULOS ESTADÍSTICOS Y VOLATILIDAD ===
  let priceVariation = 0, costVariation = 0;
  let firstPrice = 0, lastPrice = 0, maxPrice = 0;

  if (historyData.length > 1) {
    const firstData = historyData[0];
    const lastData = historyData[historyData.length - 1];

    firstPrice = firstData[currentPriceKey];
    lastPrice = lastData[currentPriceKey];
    
    // Obtenemos el pico máximo de todo el periodo
    maxPrice = Math.max(...historyData.map(d => d[currentPriceKey] || 0));

    if (firstPrice > 0) {
      priceVariation = ((lastPrice - firstPrice) / firstPrice) * 100;
    }

    const firstCost = firstData[currentCostKey];
    const lastCost = lastData[currentCostKey];
    if (firstCost > 0) {
      costVariation = ((lastCost - firstCost) / firstCost) * 100;
    }
  }

  const renderVariationBadge = (label: string, variation: number, isCost: boolean = false) => {
    if (variation === 0) return null;
    const isPositive = variation > 0;
    const colorClass = isPositive 
      ? (isCost ? 'text-red-400 bg-red-400/10 border-red-500/20' : 'text-green-400 bg-green-400/10 border-green-500/20') 
      : (isCost ? 'text-green-400 bg-green-400/10 border-green-500/20' : 'text-red-400 bg-red-400/10 border-red-500/20');

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colorClass} text-xs font-bold shrink-0`}>
        <span className="text-gray-400 font-medium mr-1 uppercase tracking-wider text-[10px]">{label}:</span>
        {isPositive ? (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
        )}
        {Math.abs(variation).toFixed(2)}%
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      
      {/* Controles Superiores */}
      <div className="flex flex-wrap gap-4 items-end justify-between mb-6 pb-6 border-b border-gray-800 shrink-0">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Fecha Inicio</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#161616] border border-gray-700 text-white rounded-lg px-4 py-2 focus:border-brand-orange focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Fecha Fin</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#161616] border border-gray-700 text-white rounded-lg px-4 py-2 focus:border-brand-orange focus:outline-none transition-colors"
            />
          </div>
          <button 
            onClick={fetchGraphData}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2.5 rounded-lg transition-colors border border-gray-600"
          >
            Actualizar
          </button>
        </div>

        {/* Switch Junto / Separado */}
        {product.presentations && product.presentations.length > 1 && (
          <div className="flex bg-[#111111] p-1 rounded-xl border border-gray-700">
            <button 
              onClick={() => setViewMode('separado')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'separado' ? 'bg-brand-orange text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Individual
            </button>
            <button 
              onClick={() => setViewMode('junto')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'junto' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todas Juntas
            </button>
          </div>
        )}
      </div>

      {/* Contenedor del Gráfico */}
      <div className="flex-1 min-h-0 bg-[#111111] border border-gray-800 rounded-xl p-4 relative flex flex-col">
        
        {/* === BARRA DE ESTADÍSTICAS Y VOLATILIDAD === */}
        {historyData.length > 1 && hasChanges && viewMode === 'separado' && !isLoading && (
          <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-800 shrink-0">
            {/* Variaciones Porcentuales */}
            {renderVariationBadge("Var. Costo", costVariation, true)}
            {renderVariationBadge("Var. Precio", priceVariation, false)}
            
            <div className="h-6 w-px bg-gray-700 mx-1 hidden sm:block"></div>
            
            {/* Hitos de Precio */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-gray-700 text-xs">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Inicial:</span>
              <span className="text-gray-300 font-mono font-medium">${firstPrice.toFixed(2)}</span>
            </div>
            
            {/* Pico Máximo destacado en Naranja */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-orange/10 border border-brand-orange/40 text-xs shadow-[0_0_10px_rgba(255,107,0,0.1)]">
              <span className="text-brand-orange/80 uppercase tracking-wider text-[10px] font-bold">Pico Máximo:</span>
              <span className="text-brand-orange font-mono font-black">${maxPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-gray-700 text-xs">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Final:</span>
              <span className="text-white font-mono font-bold">${lastPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111111]/80 backdrop-blur-sm rounded-xl">
             <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : historyData.length === 0 ? (
          <div className="text-center text-gray-500 flex-1 flex items-center justify-center">No hay datos para el rango seleccionado.</div>
        ) : !hasChanges && viewMode === 'separado' ? (
          <div className="text-center p-6 bg-[#1a1a1a] rounded-xl border border-gray-800 max-w-md mx-auto my-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-600 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Precio Estable</h3>
            <p className="text-gray-400">
              Esta presentación no registró cambios. Precio: <span className="text-green-500 font-bold">${historyData[0][currentPriceKey]?.toFixed(2)}</span> / Costo: <span className="text-gray-300 font-bold">${historyData[0][currentCostKey]?.toFixed(2)}</span>.
            </p>
          </div>
        ) : (
          <div className="w-full flex-1 overflow-x-auto custom-scrollbar pb-2">
            <div style={{ minWidth: Math.max(100, historyData.length * 80) + 'px', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number, name: string) => {
                      const isPrice = name.startsWith('price_');
                      return [`$${value.toFixed(2)}`, isPrice ? 'Precio Público' : 'Costo Proveedor'];
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>

                  {viewMode === 'junto' && product.presentations
                    .filter(p => p.id !== presentation.id)
                    .map(p => (
                      <React.Fragment key={p.id}>
                        <Line 
                          type="monotone" 
                          name={`price_${p.id}`} 
                          dataKey={`price_${p.id}`} 
                          stroke="#ff6b00" 
                          strokeWidth={2} 
                          strokeOpacity={0.5} 
                          dot={false} 
                          activeDot={false} 
                          isAnimationActive={false}
                          legendType="none" 
                        />
                        <Line 
                          type="monotone" 
                          name={`cost_${p.id}`} 
                          dataKey={`cost_${p.id}`} 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          strokeOpacity={0.5} 
                          dot={false} 
                          activeDot={false} 
                          isAnimationActive={false}
                          legendType="none"
                        />
                      </React.Fragment>
                    ))
                  }

                  <Line 
                    type="monotone" 
                    name={`price_${presentation.id}`} 
                    dataKey={`price_${presentation.id}`} 
                    stroke="#ff6b00" 
                    strokeWidth={3} 
                    activeDot={{ r: 6, fill: '#ff6b00', stroke: '#1a1a1a', strokeWidth: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    name={`cost_${presentation.id}`} 
                    dataKey={`cost_${presentation.id}`} 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#1a1a1a', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphHistory;