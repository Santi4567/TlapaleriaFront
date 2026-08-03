// src/components/Inventario/InventoryTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { InventoryMovementResponse, MOVEMENT_TYPES } from '../../types/inventory';
import { Product } from '../../types/product';
import { useAuth } from '../../context/AuthContext';

interface InventoryTableProps {
  refreshTrigger: number;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const token = user?.token || '';

  const [movements, setMovements] = useState<InventoryMovementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dateMode, setDateMode] = useState<'day' | 'range'>('day');

  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [localMovementType, setLocalMovementType] = useState('');

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [selectedFilterProduct, setSelectedFilterProduct] = useState<Product | null>(null);

  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '', 
    endDate: '',   
    productId: '',
    movementType: ''
  });

  // ==========================================
  // FUNCIÓN INTELIGENTE PARA AUTO-FORMATEAR 
  // ==========================================
  const handleDateInput = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>, 
    currentValue: string
  ) => {
    const newValue = e.target.value;

    // Si el usuario está borrando (Backspace/Delete), dejamos el input tal cual
    // para no recorrer los números de lugar y causar el error "00/08/20262"
    if (newValue.length < currentValue.length) {
      setter(newValue);
      return;
    }

    // Si está escribiendo, forzamos el formato
    let rawValue = newValue.replace(/\D/g, ''); // Quitamos todo menos números
    if (rawValue.length > 8) rawValue = rawValue.substring(0, 8); // Máximo 8 dígitos (DDMMAAAA)

    let formattedValue = rawValue;
    if (rawValue.length > 4) {
      formattedValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2, 4)}/${rawValue.substring(4, 8)}`;
    } else if (rawValue.length > 2) {
      formattedValue = `${rawValue.substring(0, 2)}/${rawValue.substring(2)}`;
    }

    setter(formattedValue);
  };

  // ==========================================
  // FUNCIÓN PARA CONVERTIR A YYYY-MM-DD
  // ==========================================
  const formatDateForAPI = (dateStr: string) => {
    if (dateStr.length !== 10) return ''; 
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (productSearchTerm.trim().length > 0 && !selectedFilterProduct) {
        const response = await productService.searchProducts(token, productSearchTerm);
        if (response?.success) {
          setProductSearchResults(response.data.slice(0, 5));
        }
      } else {
        setProductSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearchTerm, token, selectedFilterProduct]);

  const handleSelectProduct = (product: Product) => {
    setSelectedFilterProduct(product);
    setProductSearchTerm(`${product.internalCode} - ${product.name}`);
    setProductSearchResults([]);
  };

  const handleProductSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductSearchTerm(e.target.value);
    if (selectedFilterProduct) {
      setSelectedFilterProduct(null);
    }
  };

  const fetchGlobalMovements = useCallback(async () => {
    setIsLoading(true);
    
    const params: any = { page: 1, pageSize: 100 };

    if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
    if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;
    if (appliedFilters.productId) params.productId = Number(appliedFilters.productId);
    if (appliedFilters.movementType) params.movementType = Number(appliedFilters.movementType);

    const res = await inventoryService.getMovements(token, params);

    if (res?.success && res.data) {
      setMovements(res.data.data || (res.data as any)); 
    } else {
      setMovements([]);
    }
    
    setIsLoading(false);
  }, [token, appliedFilters]);

  useEffect(() => {
    fetchGlobalMovements();
  }, [fetchGlobalMovements, refreshTrigger]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiStartDate = formatDateForAPI(localStartDate);
    const apiEndDate = dateMode === 'range' ? formatDateForAPI(localEndDate) : '';

    setAppliedFilters({
      startDate: apiStartDate,
      endDate: apiEndDate, 
      productId: selectedFilterProduct ? selectedFilterProduct.id.toString() : '',
      movementType: localMovementType
    });
  };

  const handleClearFilters = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setProductSearchTerm('');
    setSelectedFilterProduct(null);
    setLocalMovementType('');
    setDateMode('day');
    
    setAppliedFilters({
      startDate: '',
      endDate: '',
      productId: '',
      movementType: ''
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-800 bg-[#1a1a1a] flex flex-col gap-5 z-20">
        <div>
          <h3 className="text-white font-bold text-lg">Últimos Movimientos (Global)</h3>
          <p className="text-gray-500 text-xs mt-1">Historial general de la sucursal (Últimos 100 registros).</p>
        </div>
        
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-4">
          
          {/* CONTROLES DE FECHA (CON INPUTS MÁS LARGOS) */}
          <div className="flex flex-col gap-2 p-3 bg-[#121212] rounded-xl border border-gray-800">
            
            <div className="flex justify-between items-center gap-4">
              <div className="flex bg-[#1c1c1c] rounded-lg p-1 border border-gray-800 w-fit">
                <button
                  type="button"
                  onClick={() => { setDateMode('day'); setLocalEndDate(''); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${dateMode === 'day' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  Día
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('range')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${dateMode === 'range' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  Rango
                </button>
              </div>
              <span className="text-[10px] text-gray-500 hidden sm:block">
                Formato: <strong className="text-gray-400">DD/MM/AAAA</strong>
              </span>
            </div>
            
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={localStartDate}
                onChange={(e) => handleDateInput(e, setLocalStartDate, localStartDate)}
                placeholder="DD/MM/AAAA"
                className="bg-[#1c1c1c] border border-gray-800 rounded-lg px-4 py-2 text-sm text-center text-white focus:border-brand-orange outline-none transition-colors w-[160px] font-mono tracking-widest placeholder-gray-600"
                title={dateMode === 'day' ? 'Fecha de búsqueda' : 'Fecha de Inicio'}
              />
              
              {dateMode === 'range' && (
                <>
                  <span className="text-gray-600 text-sm font-bold mx-1">a</span>
                  <input 
                    type="text" 
                    value={localEndDate}
                    onChange={(e) => handleDateInput(e, setLocalEndDate, localEndDate)}
                    placeholder="DD/MM/AAAA"
                    className="bg-[#1c1c1c] border border-gray-800 rounded-lg px-4 py-2 text-sm text-center text-white focus:border-brand-orange outline-none transition-colors w-[160px] font-mono tracking-widest placeholder-gray-600"
                    title="Fecha de Fin"
                  />
                </>
              )}
            </div>
          </div>

          {/* FILTRO POR PRODUCTO */}
          <div className="flex flex-col flex-1 min-w-[200px] relative">
            <label className="text-[10px] font-bold text-gray-500 mb-2 tracking-wider uppercase">Filtro por Producto</label>
            <input 
              type="text" 
              placeholder="Buscar clave o nombre..."
              value={productSearchTerm}
              onChange={handleProductSearchChange}
              className={`bg-[#121212] border rounded-xl p-3 text-sm text-white outline-none transition-colors w-full
                ${selectedFilterProduct ? 'border-brand-orange text-brand-orange font-bold' : 'border-gray-800 focus:border-brand-orange placeholder-gray-600'}`}
            />
            {productSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#1c1c1c] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                {productSearchResults.map(prod => (
                  <div 
                    key={prod.id} 
                    onClick={() => handleSelectProduct(prod)}
                    className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0 flex flex-col"
                  >
                    <span className="text-xs font-bold text-brand-orange">{prod.internalCode}</span>
                    <span className="text-sm text-white truncate">{prod.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FILTRO POR TIPO DE MOVIMIENTO */}
          <div className="flex flex-col flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-gray-500 mb-2 tracking-wider uppercase">Tipo de Movimiento</label>
            <select
              value={localMovementType}
              onChange={(e) => setLocalMovementType(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#121212] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-brand-orange outline-none transition-colors w-full"
            >
              <option value="" className="bg-[#121212] text-white">Todos</option>
              <option value="1" className="bg-[#121212] text-white">Entradas (1)</option>
              <option value="2" className="bg-[#121212] text-white">Mermas (2)</option>
              <option value="3" className="bg-[#121212] text-white">Ajustes Positivos (3)</option>
              <option value="4" className="bg-[#121212] text-white">Ajustes Negativos (4)</option>
              <option value="5" className="bg-[#121212] text-white">Ventas mostrador (5)</option>
              <option value="6" className="bg-[#121212] text-white">Devoluciones (6)</option>
            </select>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-2 ml-auto mb-1">
            <button 
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-xl transition-colors"
            >
              Limpiar
            </button>
            <button 
              type="submit"
              className="px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md flex items-center gap-2"
            >
              Aplicar Filtros 🔍
            </button>
          </div>
        </form>
      </div>
      
      {/* TABLA DE RESULTADOS */}
      <div className="flex-1 bg-[#161616] overflow-hidden flex flex-col relative z-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-brand-orange animate-pulse font-bold text-lg">
            Cargando auditoría...
          </div>
        ) : movements.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
            <span className="text-4xl mb-2">📋</span>
            <p>No se encontraron movimientos con los filtros actuales.</p>
          </div>
        ) : (
          <div className="overflow-auto h-full custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#121212] sticky top-0 border-b border-gray-800 text-gray-400 shadow-md">
                <tr>
                  <th className="p-4 font-medium whitespace-nowrap">Fecha</th>
                  <th className="p-4 font-medium">Producto</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium text-center">Cant.</th>
                  <th className="p-4 font-medium">Motivo</th>
                  <th className="p-4 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => {
                  const typeData = MOVEMENT_TYPES[mov.movementType] || { label: 'Desconocido', color: 'text-gray-400', sign: '' };
                  const isPositive = typeData.sign === '+';

                  return (
                    <tr key={mov.id} className="border-b border-gray-800/50 hover:bg-[#1c1c1c] transition-colors">
                      <td className="p-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleString(undefined, {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-brand-orange font-mono text-xs font-bold">{mov.product?.internalCode || `ID: ${mov.productId}`}</span>
                          <span className="text-white font-medium truncate max-w-[200px]" title={mov.product?.name}>{mov.product?.name || 'Producto Desconocido'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded border text-xs font-bold whitespace-nowrap ${typeData.color}`}>
                          {typeData.label}
                        </span>
                      </td>
                      <td className={`p-4 text-center font-mono font-bold text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {typeData.sign}{mov.quantity}
                      </td>
                      <td className="p-4 text-gray-400 text-xs truncate max-w-[200px]" title={mov.notes}>
                        {mov.notes}
                      </td>
                      <td className="p-4 text-gray-500 font-medium truncate max-w-[120px]" title={mov.user?.name}>
                        {mov.user?.name || 'Sistema'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTable;