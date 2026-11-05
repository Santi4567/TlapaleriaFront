// src/components/products/QuickPriceModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import { Product, QuickPriceUpdateRequest } from '../../types/product';
import { Supplier } from '../../types/supplier';
import {
  DollarSign,
  Truck,
  Percent,
  Save,
  X,
  AlertTriangle,
  Calculator,
  Layers,
  ShieldAlert
} from 'lucide-react';

interface QuickPriceModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: (updatedProduct: Product) => void;
}

interface PresentationFormRow {
  id: number;
  name: string;
  stockFactor: number;
  supplierPrice: number;
  price: number;
  isActive: boolean;
}

export const QuickPriceModal: React.FC<QuickPriceModalProps> = ({
  isOpen,
  product,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const token = user?.token || '';

  // Proveedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  // Campos del formulario
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [globalMargin, setGlobalMargin] = useState<string>('');
  const [rows, setRows] = useState<PresentationFormRow[]>([]);

  // Estados de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proveedores disponibles
  const loadSuppliers = useCallback(async () => {
    if (!token) return;
    setIsLoadingSuppliers(true);
    try {
      const res = await supplierService.getSuppliers(token, 1, 100, true);
      if (res && res.success && res.data?.data) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error('Error cargando proveedores para modal de precios:', err);
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, [token]);

  // Inicializar estado al abrir el modal con el producto seleccionado
  useEffect(() => {
    if (isOpen && product) {
      loadSuppliers();
      setSelectedSupplierId(product.supplierId || 0);
      setGlobalMargin(
        product.profitMargin !== null && product.profitMargin !== undefined
          ? String(product.profitMargin)
          : ''
      );

      const initialRows: PresentationFormRow[] = (product.presentations || []).map((p) => ({
        id: p.id,
        name: p.name,
        stockFactor: p.stockFactor,
        supplierPrice: p.supplierPrice ?? 0,
        price: p.price ?? 0,
        isActive: p.isActive ?? true,
      }));
      setRows(initialRows);
      setError(null);
    }
  }, [isOpen, product, loadSuppliers]);

  // Calcular precio con base en margen
  const calculatePrice = (cost: number, marginPercent: number): number => {
    if (cost < 0 || marginPercent < 0) return cost;
    const computed = cost * (1 + marginPercent / 100);
    return Math.round(computed * 100) / 100;
  };

  // Aplicar margen global a todas las presentaciones
  const handleApplyGlobalMargin = () => {
    const marginNum = parseFloat(globalMargin);
    if (isNaN(marginNum) || marginNum < 0) {
      setError('Por favor ingresa un margen de ganancia válido (0% o superior).');
      return;
    }
    setError(null);

    setRows((prev) =>
      prev.map((r) => {
        if (r.supplierPrice > 0) {
          return {
            ...r,
            price: calculatePrice(r.supplierPrice, marginNum),
          };
        }
        return r;
      })
    );
  };

  // Calcular precio para una sola fila usando el margen global
  const handleCalculateSingleRow = (index: number) => {
    const marginNum = parseFloat(globalMargin);
    if (isNaN(marginNum) || marginNum < 0) {
      setError('Ingresa primero un margen objetivo en el campo superior.');
      return;
    }
    setError(null);

    setRows((prev) =>
      prev.map((r, i) => {
        if (i === index && r.supplierPrice > 0) {
          return {
            ...r,
            price: calculatePrice(r.supplierPrice, marginNum),
          };
        }
        return r;
      })
    );
  };

  // Actualizar costo de proveedor en una fila
  const handleSupplierPriceChange = (index: number, val: string) => {
    const num = parseFloat(val);
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, supplierPrice: isNaN(num) ? 0 : Math.max(0, num) } : r))
    );
  };

  // Actualizar precio de venta en una fila
  const handlePriceChange = (index: number, val: string) => {
    const num = parseFloat(val);
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, price: isNaN(num) ? 0 : Math.max(0, num) } : r))
    );
  };

  // Toggle de activo/inactivo por presentación
  const handleToggleActive = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isActive: !r.isActive } : r))
    );
  };

  // Detectar si alguna fila activa tiene precio de venta menor al costo
  const hasLossWarning = useMemo(() => {
    return rows.some((r) => r.isActive && r.supplierPrice > 0 && r.price < r.supplierPrice);
  }, [rows]);

  // Manejo de guardar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !product) return;

    if (!selectedSupplierId || selectedSupplierId <= 0) {
      setError('Debes seleccionar un proveedor para este producto.');
      return;
    }

    if (rows.length === 0) {
      setError('El producto debe contener al menos una presentación.');
      return;
    }

    // Validar números
    for (const r of rows) {
      if (r.price < 0 || r.supplierPrice < 0) {
        setError(`Los precios de la presentación "${r.name}" no pueden ser negativos.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const marginNum = globalMargin.trim() === '' ? null : parseFloat(globalMargin);

    const payload: QuickPriceUpdateRequest = {
      supplierId: selectedSupplierId,
      profitMargin: marginNum !== null && !isNaN(marginNum) ? marginNum : null,
      presentations: rows.map((r) => ({
        id: r.id,
        price: r.price,
        supplierPrice: r.supplierPrice,
        isActive: r.isActive,
      })),
    };

    const res = await productService.updatePricing(token, product.id, payload);
    setIsSubmitting(false);

    if (res && res.success && res.data) {
      onSaved(res.data);
      onClose();
    } else {
      setError(res?.message || 'Ocurrió un error al guardar los precios en el servidor.');
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#161616] border-2 border-gray-800 rounded-3xl w-full max-w-5xl 2xl:max-w-6xl max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between p-6 md:p-7 border-b border-gray-800 shrink-0 bg-[#121212]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
                  {product.internalCode}
                </span>
                {product.brand && (
                  <span className="text-xs font-bold text-gray-400 bg-gray-800/80 px-2.5 py-0.5 rounded-md border border-gray-700">
                    {product.brand}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Unidad: <strong className="text-gray-300">{product.unitOfMeasure}</strong>
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mt-1 truncate max-w-[500px]" title={product.name}>
                {product.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE ERROR */}
        {error && (
          <div className="mx-6 md:mx-7 mt-4 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-500/30 bg-red-500/15 text-red-300 animate-in fade-in duration-200 shrink-0">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-semibold opacity-70 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ALERTA DE VENTA POR DEBAJO DE COSTO */}
        {hasLossWarning && (
          <div className="mx-6 md:mx-7 mt-3 p-3.5 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-bold border border-amber-500/30 bg-amber-500/15 text-amber-300 shrink-0">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              Atención: Al menos una presentación tiene un <strong>precio de venta inferior al costo del proveedor</strong> (margen negativo).
            </span>
          </div>
        )}

        {/* CUERPO DEL MODAL (SCROLLABLE) */}
        <div className="p-6 md:p-7 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* SECCIÓN SUPERIOR: PROVEEDOR Y MARGEN GLOBAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
            
            {/* SELECCIÓN DE PROVEEDOR */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-orange" />
                <span>Proveedor Asignado *</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                  disabled={isLoadingSuppliers || isSubmitting}
                  className="w-full bg-[#111111] border border-gray-700 focus:border-brand-orange rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value={0} disabled>
                    {isLoadingSuppliers ? 'Cargando proveedores...' : '-- Selecciona un proveedor --'}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contactName ? `(${s.contactName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Cambia el proveedor directamente sin tener que editar el resto del producto.
              </p>
            </div>

            {/* MARGEN OBJETIVO Y ACCIÓN DE CÁLCULO */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>Margen de Ganancia Objetivo (%)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.5"
                    value={globalMargin}
                    onChange={(e) => setGlobalMargin(e.target.value)}
                    placeholder="Ej. 30"
                    className="w-full bg-[#111111] border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    %
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyGlobalMargin}
                  disabled={!globalMargin || isSubmitting}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs md:text-sm px-4 py-3 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title="Calcula automáticamente el precio de venta de todas las presentaciones con base en su costo de proveedor"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Aplicar Margen</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Aplica la fórmula: <code className="text-gray-400">Costo × (1 + Margen / 100)</code> a todos los costos.
              </p>
            </div>
          </div>

          {/* TABLA DE PRESENTACIONES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-400" />
                <span>Precios por Presentación</span>
              </h4>
              <span className="text-xs text-gray-400">
                {rows.length} {rows.length === 1 ? 'presentación' : 'presentaciones'} registrada(s)
              </span>
            </div>

            <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#161616]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm text-gray-200">
                  <thead className="bg-[#111111] text-gray-400 uppercase text-xs font-bold border-b border-gray-800">
                    <tr>
                      <th className="px-5 py-4 w-[200px]">Presentación</th>
                      <th className="px-4 py-4 w-[170px]">Costo Proveedor ($)</th>
                      <th className="px-3 py-4 text-center w-[110px]">Margen Real</th>
                      <th className="px-5 py-4 w-[250px]">Precio Venta ($)</th>
                      <th className="px-3 py-4 text-center w-[130px]">Ganancia Unitaria</th>
                      <th className="px-4 py-4 text-center w-[110px]">Para Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/80">
                    {rows.map((row, idx) => {
                      const cost = row.supplierPrice || 0;
                      const price = row.price || 0;
                      const profit = price - cost;
                      const marginPercent = cost > 0 ? ((price - cost) / cost) * 100 : null;
                      const isNegative = cost > 0 && price < cost;

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-gray-800/30 transition-colors ${
                            !row.isActive ? 'opacity-60 bg-black/20' : ''
                          }`}
                        >
                          {/* NOMBRE Y FACTOR */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-white text-base">{row.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                              <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 font-mono">
                                Factor: x{row.stockFactor}
                              </span>
                              <span>({product.unitOfMeasure})</span>
                            </div>
                          </td>

                          {/* COSTO PROVEEDOR */}
                          <td className="px-4 py-4">
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.supplierPrice === 0 ? '' : row.supplierPrice}
                                onChange={(e) => handleSupplierPriceChange(idx, e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#111111] border border-gray-700 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 rounded-xl pl-9 pr-3 py-2.5 text-base font-bold font-mono text-white outline-none transition-all"
                              />
                            </div>
                          </td>

                          {/* MARGEN REAL CALCULADO */}
                          <td className="px-3 py-4 text-center">
                            {marginPercent === null ? (
                              <span className="text-xs text-gray-500 font-medium">--</span>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${
                                  isNegative
                                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                }`}
                                title={`Margen: ${marginPercent.toFixed(2)}%`}
                              >
                                {marginPercent >= 0 ? '+' : ''}
                                {marginPercent.toFixed(1)}%
                              </span>
                            )}
                          </td>

                          {/* PRECIO DE VENTA */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-lg ${
                                  isNegative ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.price === 0 ? '' : row.price}
                                  onChange={(e) => handlePriceChange(idx, e.target.value)}
                                  placeholder="0.00"
                                  className={`w-full bg-[#0d0d0d] border rounded-xl pl-9 pr-3 py-2.5 text-lg font-black font-mono outline-none transition-all shadow-inner ${
                                    isNegative
                                      ? 'border-red-500/80 text-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
                                      : 'border-emerald-500/40 text-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30'
                                  }`}
                                />
                              </div>
                              {globalMargin && row.supplierPrice > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleCalculateSingleRow(idx)}
                                  className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center shrink-0 transition-colors border border-gray-700 cursor-pointer shadow-sm"
                                  title={`Recalcular este precio con el margen del ${globalMargin}%`}
                                >
                                  <Calculator className="w-4 h-4 text-emerald-400" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* GANANCIA UNITARIA NETA */}
                          <td className="px-3 py-4 text-center font-mono font-bold text-sm">
                            <span className={profit < 0 ? 'text-red-400' : profit > 0 ? 'text-emerald-400' : 'text-gray-400'}>
                              {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                            </span>
                          </td>

                          {/* TOGGLE ACTIVO / INACTIVO */}
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(idx)}
                              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
                                row.isActive
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                              }`}
                              title={
                                row.isActive
                                  ? 'Presentación activa para venta en mostrador (click para desactivar)'
                                  : 'Presentación oculta en ventas (click para activar)'
                              }
                            >
                              {row.isActive ? 'Activa' : 'Oculta'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-6 md:p-7 border-t border-gray-800 shrink-0 bg-[#121212] flex items-center justify-between gap-4">
          <div className="text-xs text-gray-400 hidden sm:block">
            Los cambios se registran en el historial de costos y precios con tu usuario.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando Precios...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Precios</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
