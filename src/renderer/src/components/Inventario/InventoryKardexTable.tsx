// src/components/Inventario/InventoryKardexTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types/product';
import { inventoryService } from '../../services/inventoryService';
import { InventoryMovementResponse, MOVEMENT_TYPES } from '../../types/inventory';
import { useAuth } from '../../context/AuthContext';

interface InventoryKardexTableProps {
  product: Product;
  refreshTrigger: number;
}

const InventoryKardexTable: React.FC<InventoryKardexTableProps> = ({ product, refreshTrigger }) => {
  const { user } = useAuth();
  const token = user?.token || '';

  const [movements, setMovements] = useState<InventoryMovementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PAGINACIÓN
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 100;

  // FILTROS
  const [dateMode, setDateMode] = useState<'day' | 'range'>('day');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [localMovementType, setLocalMovementType] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    movementType: ''
  });

  const handleDateInput = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>, 
    currentValue: string
  ) => {
    const newValue = e.target.value;
    if (newValue.length < currentValue.length) {
      setter(newValue);
      return;
    }
    let rawValue = newValue.replace(/\D/g, '');
    if (rawValue.length > 8) rawValue = rawValue.substring(0, 8);
    let formattedValue = rawValue;
    if (rawValue.length > 4) {
      formattedValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2, 4)}/${rawValue.substring(4, 8)}`;
    } else if (rawValue.length > 2) {
      formattedValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2)}`;
    }
    setter(formattedValue);
  };

  const formatDateForAPI = (dateStr: string) => {
    if (dateStr.length !== 10) return ''; 
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  const fetchKardex = useCallback(async () => {
    setIsLoading(true);
    
    const params: any = { 
      productId: product.id, 
      page, 
      pageSize 
    };

    if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
    if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;
    if (appliedFilters.movementType) params.movementType = Number(appliedFilters.movementType);

    const res = await inventoryService.getMovements(token, params);

    if (res?.success && res.data) {
      const data = res.data.data || (res.data as any);
      setMovements(data);
      // Si nos devolvió 100 exactos, asumimos que puede haber una página siguiente
      setHasMore(data.length === pageSize);
    } else {
      setMovements([]);
      setHasMore(false);
    }
    
    setIsLoading(false);
  }, [token, appliedFilters, product.id, page]);

  useEffect(() => {
    fetchKardex();
  }, [fetchKardex, refreshTrigger]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reiniciar a la página 1 al buscar
    setAppliedFilters({
      startDate: formatDateForAPI(localStartDate),
      endDate: dateMode === 'range' ? formatDateForAPI(localEndDate) : '',
      movementType: localMovementType
    });
  };

  const handleClearFilters = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setLocalMovementType('');
    setDateMode('day');
    setPage(1);
    setAppliedFilters({ startDate: '', endDate: '', movementType: '' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800">
      
      {/* BARRA DE FILTROS DEL KARDEX */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-3">Historial del Producto (Kardex)</h3>
        
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-3 bg-[#121212] p-3 rounded-xl border border-gray-800">
          
          <div className="flex flex-col gap-2">
            <div className="flex bg-[#1c1c1c] rounded-lg p-1 border border-gray-800 w-fit">
              <button type="button" onClick={() => { setDateMode('day'); setLocalEndDate(''); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${dateMode === 'day' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Día</button>
              <button type="button" onClick={() => setDateMode('range')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${dateMode === 'range' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Rango</button>
            </div>
            
            <div className="flex gap-2 items-center">
              <input type="text" value={localStartDate} onChange={(e) => handleDateInput(e, setLocalStartDate, localStartDate)} placeholder="DD/MM/AAAA" className="bg-[#1c1c1c] border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-center text-white focus:border-brand-orange outline-none transition-colors w-[150px] font-mono tracking-widest placeholder-gray-600" />
              {dateMode === 'range' && (
                <>
                  <span className="text-gray-600 text-sm font-bold mx-1">a</span>
                  <input type="text" value={localEndDate} onChange={(e) => handleDateInput(e, setLocalEndDate, localEndDate)} placeholder="DD/MM/AAAA" className="bg-[#1c1c1c] border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-center text-white focus:border-brand-orange outline-none transition-colors w-[150px] font-mono tracking-widest placeholder-gray-600" />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">Tipo</label>
            <select value={localMovementType} onChange={(e) => setLocalMovementType(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-2 text-sm text-white focus:border-brand-orange outline-none transition-colors w-full">
              <option value="" className="bg-[#121212] text-white">Todos</option>
              <option value="1" className="bg-[#121212] text-white">Entradas (1)</option>
              <option value="2" className="bg-[#121212] text-white">Mermas (2)</option>
              <option value="3" className="bg-[#121212] text-white">Ajustes Pos. (3)</option>
              <option value="4" className="bg-[#121212] text-white">Ajustes Neg. (4)</option>
              <option value="5" className="bg-[#121212] text-white">Ventas (5)</option>
              <option value="6" className="bg-[#121212] text-white">Devoluciones (6)</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={handleClearFilters} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition-colors">Limpiar</button>
            <button type="submit" className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md">Filtrar 🔍</button>
          </div>
        </form>
      </div>
      
      {/* TABLA */}
      <div className="flex-1 bg-[#121212] rounded-xl border border-gray-800 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-brand-orange animate-pulse font-bold">Cargando historial...</div>
        ) : movements.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
            <span className="text-4xl mb-2">📄</span>
            <p>No hay movimientos registrados.</p>
          </div>
        ) : (
          <div className="overflow-auto h-[350px] custom-scrollbar relative">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1a1a1a] sticky top-0 border-b border-gray-800 text-gray-400 z-10 shadow-md">
                <tr>
                  <th className="p-4 font-medium whitespace-nowrap">Fecha / Hora</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium text-center">Cant.</th>
                  <th className="p-4 font-medium text-center">Saldo</th>
                  <th className="p-4 font-medium">Motivo</th>
                  <th className="p-4 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => {
                  const typeData = MOVEMENT_TYPES[mov.movementType] || { label: 'Desconocido', color: 'text-gray-400', sign: '' };
                  const isPositive = typeData.sign === '+';

                  return (
                    <tr key={mov.id} className="border-b border-gray-800/50 hover:bg-[#1f1f1f] transition-colors">
                      <td className="p-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4"><span className={`px-2 py-1 rounded border text-xs font-bold whitespace-nowrap ${typeData.color}`}>{typeData.label}</span></td>
                      <td className={`p-4 text-center font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{typeData.sign} {mov.quantity}</td>
                      <td className="p-4 text-center text-white font-mono font-bold bg-black/20">{mov.newStock}</td>
                      <td className="p-4 text-gray-400 text-xs truncate max-w-[150px]" title={mov.notes}>{mov.notes || '—'}</td>
                      <td className="p-4 text-gray-500 truncate max-w-[100px]">{mov.user?.name || 'Sistema'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-500 font-bold tracking-wider uppercase">Página {page}</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${page === 1 ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            ← Anterior
          </button>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={!hasMore}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${!hasMore ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            Siguiente →
          </button>
        </div>
      </div>

    </div>
  );
};

export default InventoryKardexTable;