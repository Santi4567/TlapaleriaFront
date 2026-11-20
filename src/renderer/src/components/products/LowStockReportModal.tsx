// src/components/products/LowStockReportModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Package,
  Truck,
  DollarSign,
  Search,
  X,
  Phone,
  User,
  Check,
  Copy,
  Edit2,
  Save,
  RotateCw,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import { LowStockItem, LowStockReport, LowStockSupplierGroup } from '../../types/product';
import { Supplier } from '../../types/supplier';

interface LowStockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProductEdit?: (productId: number) => void;
}

export const LowStockReportModal: React.FC<LowStockReportModalProps> = ({
  isOpen,
  onClose,
  onOpenProductEdit
}) => {
  const { user } = useAuth();
  const token = user?.token || '';

  const [report, setReport] = useState<LowStockReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Edición rápida inline de mínimo/máximo
  const [editingItem, setEditingItem] = useState<{
    productId: number;
    minStock: number;
    maxStock: string;
  } | null>(null);
  const [isSavingLevels, setIsSavingLevels] = useState(false);

  // Feedback de copiado al portapapeles
  const [copiedSupplierId, setCopiedSupplierId] = useState<number | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const formatQty = (qty: number) =>
    Number(qty).toLocaleString('es-MX', { maximumFractionDigits: 3 });

  // Cargar catálogo de proveedores para el selector
  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchSuppliers = async () => {
      const res = await supplierService.getSuppliers(token, 1, 100, true);
      if (res && res.success) {
        setSuppliers(res.data.data);
      }
    };
    fetchSuppliers();
  }, [isOpen, token]);

  // Cargar reporte de stock bajo
  const fetchReport = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    const res = await productService.getLowStockReport(
      token,
      selectedSupplierId > 0 ? selectedSupplierId : undefined,
      searchTerm.trim() || undefined
    );

    if (res && res.success && res.data) {
      setReport(res.data);
    } else {
      setError(res?.message || 'No se pudo cargar el reporte de resurtido.');
    }
    setIsLoading(false);
  }, [token, selectedSupplierId, searchTerm]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchReport();
    }, 250);
    return () => clearTimeout(timer);
  }, [isOpen, fetchReport]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingItem) {
          setEditingItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingItem, onClose]);

  // Guardar cambio rápido de niveles de stock
  const handleSaveStockLevels = async (item: LowStockItem) => {
    if (!editingItem || !token) return;
    setIsSavingLevels(true);

    const min = Math.max(0, Number(editingItem.minStock) || 0);
    const maxVal = editingItem.maxStock.trim() === '' ? null : Math.max(0, Number(editingItem.maxStock) || 0);

    const res = await productService.updateStockLevels(token, item.productId, {
      minStock: min,
      maxStock: maxVal
    });

    setIsSavingLevels(false);

    if (res && res.success) {
      setEditingItem(null);
      fetchReport();
    } else {
      alert(res?.message || 'Error al actualizar niveles de stock.');
    }
  };

  // Generar y copiar texto formateado para pedido por WhatsApp
  const handleCopySupplierOrder = (group: LowStockSupplierGroup) => {
    const lines = [
      `📋 *PEDIDO SUGERIDO - ${group.supplierName.toUpperCase()}*`,
      group.supplierContact ? `👤 Vendedor: ${group.supplierContact}` : '',
      `📅 Fecha: ${new Date().toLocaleDateString('es-MX')}`,
      `📦 Total de artículos: ${group.productsCount}`,
      `💰 Estimado: ${formatCurrency(group.estimatedCost)}`,
      '',
      '*Artículos a solicitar:*',
      ...group.items.map(
        (it, idx) =>
          `${idx + 1}. [${it.internalCode}] *${it.name}* -> Pedir: *${formatQty(it.suggestedQuantity)} ${it.unitOfMeasure}* (Stock act: ${it.currentStock}, Mín: ${it.minStock})`
      ),
      '',
      '_Generado desde Sistema Tlapalería Leo_'
    ].filter(Boolean);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSupplierId(group.supplierId);
    setTimeout(() => setCopiedSupplierId(null), 3000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-6xl max-h-[92vh] bg-[#141414] border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-800 bg-[#181818]/90">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">Stock Mínimo y Resurtido</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {report ? `${report.totalProducts} alertas` : 'Cargando...'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Productos agotados o por debajo de su punto de reorden, agrupados por proveedor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchReport}
              disabled={isLoading}
              title="Recargar reporte"
              className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-orange' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 4 TARJETAS DE RESUMEN */}
        <div className="p-6 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#141414]">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold uppercase">En Alerta</span>
              <Package className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-black text-white mt-2">
              {report?.totalProducts ?? 0}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Artículos a resurtir</p>
          </div>

          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-red-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-400 font-bold uppercase">Agotados</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <p className="text-2xl font-black text-red-400 mt-2">
              {report?.outOfStockCount ?? 0}
            </p>
            <p className="text-[11px] text-red-500/70 mt-1">Existencia en 0</p>
          </div>

          <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-bold uppercase">Bajo Mínimo</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">
              {report?.lowStockCount ?? 0}
            </p>
            <p className="text-[11px] text-amber-500/70 mt-1">Por debajo del punto de reorden</p>
          </div>

          <div className="bg-[#1a1a1a] border border-emerald-500/30 rounded-2xl p-4 bg-gradient-to-br from-[#1a1a1a] to-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-bold uppercase">Costo Estimado</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              {formatCurrency(report?.totalEstimatedCost ?? 0)}
            </p>
            <p className="text-[11px] text-emerald-500/70 mt-1">Inversión calculada a costo prov.</p>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center gap-3 bg-[#141414] border-b border-gray-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
              className="w-full py-2 px-3 bg-[#1a1a1a] border border-gray-800 focus:border-amber-400 rounded-xl text-sm text-white outline-none cursor-pointer"
            >
              <option value="0">Todos los proveedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTENIDO SCROLLABLE CON LOS GRUPOS POR PROVEEDOR */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#121212]">
          {isLoading && !report ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RotateCw className="w-8 h-8 animate-spin text-brand-orange mb-3" />
              <p className="font-bold">Calculando productos con stock bajo...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-red-400 font-bold">
              {error}
            </div>
          ) : !report || report.suppliers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Inventario en niveles óptimos</h3>
              <p className="text-sm text-gray-400 max-w-md">
                No hay productos agotados ni por debajo de su stock mínimo configurado con los filtros seleccionados.
              </p>
            </div>
          ) : (
            report.suppliers.map((group) => {
              const isCopied = copiedSupplierId === group.supplierId;

              return (
                <div
                  key={group.supplierId}
                  className="bg-[#181818] border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
                >
                  {/* Encabezado del Proveedor */}
                  <div className="p-4 bg-[#1f1f1f]/80 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base flex items-center gap-2">
                          {group.supplierName}
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300">
                            {group.productsCount} {group.productsCount === 1 ? 'producto' : 'productos'}
                          </span>
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          {group.supplierContact && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-500" />
                              {group.supplierContact}
                            </span>
                          )}
                          {group.supplierPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-500" />
                              {group.supplierPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">
                          Estimado Proveedor
                        </span>
                        <span className="text-base font-black text-emerald-400">
                          {formatCurrency(group.estimatedCost)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySupplierOrder(group)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isCopied
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-gray-800 hover:bg-orange-500 text-gray-200 hover:text-white border border-gray-700 hover:border-orange-500'
                        }`}
                        title="Copiar lista formateada para WhatsApp"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            ¡Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Pedido
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Artículos del Proveedor */}
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-800/80 text-gray-400 uppercase tracking-wider bg-[#161616]/60">
                          <th className="py-2.5 px-4 font-semibold">Código / Artículo</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Stock Actual</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Stock Mínimo</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Stock Máximo</th>
                          <th className="py-2.5 px-4 font-semibold text-center text-amber-400">Pedir Sugerido</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Costo Unit.</th>
                          <th className="py-2.5 px-4 font-semibold text-right text-emerald-400">Total Est.</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {group.items.map((item) => {
                          const isRowEditing = editingItem?.productId === item.productId;

                          return (
                            <tr
                              key={item.productId}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-brand-orange text-xs">
                                      {item.internalCode}
                                    </span>
                                    {item.brand && (
                                      <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.2 rounded font-medium">
                                        {item.brand}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-white text-sm mt-0.5">
                                    {item.name}
                                  </span>
                                  {item.location && (
                                    <span className="text-[10px] text-gray-500">
                                      Ubicación: {item.location}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`font-black text-sm ${
                                      item.currentStock <= 0 ? 'text-red-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {formatQty(item.currentStock)} {item.unitOfMeasure}
                                  </span>
                                  <span
                                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold mt-0.5 ${
                                      item.currentStock <= 0
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {item.currentStock <= 0 ? 'Agotado' : 'Bajo Mínimo'}
                                  </span>
                                </div>
                              </td>

                              {/* Mínimo y Máximo (con edición inline) */}
                              <td className="py-3 px-4 text-center">
                                {isRowEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={editingItem.minStock}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        minStock: Math.max(0, parseFloat(e.target.value) || 0)
                                      })
                                    }
                                    className="w-16 px-1.5 py-1 bg-[#121212] border border-amber-400 rounded text-center text-white font-mono font-bold text-xs outline-none"
                                  />
                                ) : (
                                  <span className="font-semibold text-gray-300">
                                    {item.minStock > 0 ? `${formatQty(item.minStock)}` : 'Sin mín.'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {isRowEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Opcional"
                                    value={editingItem.maxStock}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        maxStock: e.target.value
                                      })
                                    }
                                    className="w-16 px-1.5 py-1 bg-[#121212] border border-emerald-400 rounded text-center text-white font-mono font-bold text-xs outline-none"
                                  />
                                ) : (
                                  <span className="text-gray-400">
                                    {item.maxStock ? formatQty(item.maxStock) : '-'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  +{formatQty(item.suggestedQuantity)} {item.unitOfMeasure}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right font-mono text-gray-400">
                                {item.unitSupplierCost > 0 ? formatCurrency(item.unitSupplierCost) : '-'}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                                {item.estimatedCost > 0 ? formatCurrency(item.estimatedCost) : '-'}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {isRowEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveStockLevels(item)}
                                        disabled={isSavingLevels}
                                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                        title="Guardar nuevo mínimo"
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingItem(null)}
                                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                                        title="Cancelar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingItem({
                                            productId: item.productId,
                                            minStock: item.minStock,
                                            maxStock: item.maxStock ? String(item.maxStock) : ''
                                          })
                                        }
                                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-gray-700 transition-colors"
                                        title="Ajustar stock mínimo y máximo"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      {onOpenProductEdit && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onClose();
                                            onOpenProductEdit(item.productId);
                                          }}
                                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 border border-gray-700 transition-colors"
                                          title="Abrir ficha completa del producto"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-4 bg-[#181818] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>
            Tip: Puedes ajustar el stock mínimo directamente con el botón de lápiz ✏️ de cada fila.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
