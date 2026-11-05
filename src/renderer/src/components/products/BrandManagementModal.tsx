// src/components/products/BrandManagementModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { brandService, Brand } from '../../services/brandService';
import {
  Tag,
  Search,
  Plus,
  Edit2,
  GitMerge,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface BrandManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandsUpdated?: () => void;
}

export const BrandManagementModal: React.FC<BrandManagementModalProps> = ({
  isOpen,
  onClose,
  onBrandsUpdated,
}) => {
  const { user } = useAuth();
  const token = user?.token || '';

  // Permisos
  const checkPermission = (categoria: string, permiso: string) => {
    const userPerms = (user as any)?.permisos;
    if (!userPerms) return true;
    return userPerms[categoria]?.includes(permiso) || false;
  };

  const canAdd = checkPermission('PRODUCTS', 'add.products');
  const canEdit = checkPermission('PRODUCTS', 'edit.products');
  const canDelete = checkPermission('PRODUCTS', 'delete.products');

  // Estados de catálogo
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de acción rápida: Crear
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Estados de Renombrar
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Estados de Fusionar
  const [mergingSourceBrand, setMergingSourceBrand] = useState<Brand | null>(null);
  const [mergeTargetBrandId, setMergeTargetBrandId] = useState<number | ''>('');
  const [isMerging, setIsMerging] = useState(false);

  // Estados de Eliminar
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notificaciones internas
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Cargar catálogo de marcas
  const loadBrands = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await brandService.getBrands(token);
    if (res && res.success && res.data) {
      setBrands(res.data);
    } else {
      setBrands([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      loadBrands();
      setSearchTerm('');
      setNewBrandName('');
      setAlert(null);
      setEditingBrand(null);
      setMergingSourceBrand(null);
      setDeletingBrand(null);
    }
  }, [isOpen, loadBrands]);

  // Filtrar marcas en memoria
  const filteredBrands = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, searchTerm]);

  // Handler: Crear Marca
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBrandName.trim();
    if (!cleanName || !token) return;

    setIsCreating(true);
    setAlert(null);
    const res = await brandService.createBrand(token, cleanName);
    setIsCreating(false);

    if (res && res.success) {
      showAlert('success', `¡Marca "${res.data.name}" registrada con éxito!`);
      setNewBrandName('');
      await loadBrands();
      onBrandsUpdated?.();
    } else {
      showAlert('error', res?.message || 'No se pudo registrar la marca.');
    }
  };

  // Handler: Renombrar Marca
  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !renameValue.trim() || !token) return;

    setIsRenaming(true);
    setAlert(null);
    const res = await brandService.renameBrand(token, editingBrand.id, renameValue.trim());
    setIsRenaming(false);

    if (res && res.success) {
      showAlert('success', `¡Marca renombrada a "${res.data.name}" y productos actualizados!`);
      setEditingBrand(null);
      await loadBrands();
      onBrandsUpdated?.();
    } else {
      showAlert('error', res?.message || 'No se pudo renombrar la marca.');
    }
  };

  // Handler: Fusionar Marcas
  const handleConfirmMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergingSourceBrand || !mergeTargetBrandId || !token) return;

    setIsMerging(true);
    setAlert(null);
    const res = await brandService.mergeBrands(token, mergingSourceBrand.id, Number(mergeTargetBrandId));
    setIsMerging(false);

    if (res && res.success) {
      showAlert('success', `¡Fusión completada! Se migraron ${res.data} producto(s) a la nueva marca.`);
      setMergingSourceBrand(null);
      setMergeTargetBrandId('');
      await loadBrands();
      onBrandsUpdated?.();
    } else {
      showAlert('error', res?.message || 'No se pudo realizar la fusión.');
    }
  };

  // Handler: Eliminar Marca
  const handleConfirmDelete = async () => {
    if (!deletingBrand || !token) return;

    setIsDeleting(true);
    setAlert(null);
    const res = await brandService.deleteBrand(token, deletingBrand.id);
    setIsDeleting(false);

    if (res && res.success) {
      showAlert('success', `Marca "${deletingBrand.name}" eliminada del catálogo.`);
      setDeletingBrand(null);
      await loadBrands();
      onBrandsUpdated?.();
    } else {
      showAlert('error', res?.message || 'No se pudo eliminar la marca.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#161616] border-2 border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                Gestión de Marcas
              </h3>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                Normaliza nombres, corrige duplicados tipográficos y fusiona marcas del catálogo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICACIÓN INTERNA */}
        {alert && (
          <div
            className={`mx-6 md:mx-8 mt-4 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border animate-in fade-in duration-200 ${
              alert.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <span className="flex-1">{alert.message}</span>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className="text-xs font-semibold opacity-70 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* BARRA SUPERIOR: AGREGAR MARCA + BUSCADOR */}
        <div className="p-6 md:p-8 space-y-4 shrink-0 border-b border-gray-800/80 bg-black/20">
          {/* Formulario rápido para agregar */}
          {canAdd && (
            <form onSubmit={handleCreateBrand} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={100}
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Escribe el nombre de una nueva marca (ej. Truper, DeWalt, Pretul...)"
                  className="w-full bg-[#111111] border border-gray-700 focus:border-orange-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newBrandName.trim()}
                className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/20 whitespace-nowrap"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Registrar Marca
                  </>
                )}
              </button>
            </form>
          )}

          {/* Buscador y contador */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar marcas..."
                className="w-full bg-[#111111] border border-gray-800 focus:border-gray-700 rounded-xl pl-10 pr-8 py-2 text-xs md:text-sm text-white placeholder-gray-500 outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 self-end sm:self-auto font-mono">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>
                Total: <strong className="text-white">{filteredBrands.length}</strong>{' '}
                {filteredBrands.length === 1 ? 'marca' : 'marcas'}
                {searchTerm.trim() ? ' encontradas' : ' activas'}
              </span>
            </div>
          </div>
        </div>

        {/* LISTADO DE MARCAS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-2.5 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="text-sm font-bold">Cargando catálogo de marcas...</span>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-gray-800 rounded-2xl text-gray-500 p-8">
              <Tag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-base font-semibold text-gray-300">
                {searchTerm.trim()
                  ? `No se encontró ninguna marca con "${searchTerm.trim()}".`
                  : 'Aún no hay marcas registradas en el sistema.'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm.trim()
                  ? 'Intenta con otro término o regístrala con el formulario de arriba.'
                  : 'Las marcas se registran automáticamente al dar de alta productos o desde el botón de arriba.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="p-4 rounded-2xl bg-[#111111] border border-gray-800/80 hover:border-gray-700 flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-xs flex items-center justify-center shrink-0">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-white text-sm md:text-base truncate block group-hover:text-orange-400 transition-colors">
                        {brand.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">ID: #{brand.id}</span>
                    </div>
                  </div>

                  {/* Acciones por marca */}
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBrand(brand);
                          setRenameValue(brand.name);
                        }}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Corregir o renombrar marca en todos los productos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {canEdit && brands.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setMergingSourceBrand(brand);
                          setMergeTargetBrandId('');
                        }}
                        className="p-2 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
                        title="Fusionar productos con otra marca (unir duplicados)"
                      >
                        <GitMerge className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingBrand(brand)}
                        className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Eliminar marca del catálogo (solo si no tiene productos)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-4 md:p-6 border-t border-gray-800 flex justify-end shrink-0 bg-black/40">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* SUBMODAL: RENOMBRAR MARCA */}
        {editingBrand && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-20 animate-in fade-in duration-150">
            <form
              onSubmit={handleConfirmRename}
              className="bg-[#1a1a1a] border-2 border-orange-500/50 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg">Renombrar Marca</h4>
                  <p className="text-xs text-gray-400">
                    Se actualizarán todos los productos asociados en la base de datos.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Nombre de la Marca
                </label>
                <input
                  type="text"
                  maxLength={100}
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full bg-[#111111] border border-gray-700 focus:border-orange-500 text-white text-base font-bold rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !renameValue.trim()}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  {isRenaming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    'Guardar Cambio'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBMODAL: FUSIONAR MARCAS */}
        {mergingSourceBrand && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-20 animate-in fade-in duration-150">
            <form
              onSubmit={handleConfirmMerge}
              className="bg-[#1a1a1a] border-2 border-purple-500/50 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <GitMerge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg">Fusionar Marcas</h4>
                  <p className="text-xs text-gray-400">
                    Une marcas duplicadas en una sola marca oficial.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 leading-relaxed space-y-2">
                <p>
                  Vas a migrar todos los productos que tienen la marca{' '}
                  <strong className="text-white underline">{mergingSourceBrand.name}</strong> hacia
                  la marca destino seleccionada.
                </p>
                <p className="text-[11px] text-purple-300 font-semibold">
                  ⚠️ Una vez completada la fusión, la marca origen "{mergingSourceBrand.name}" será
                  eliminada del catálogo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Selecciona la Marca Destino (Oficial)
                </label>
                <select
                  value={mergeTargetBrandId}
                  onChange={(e) => setMergeTargetBrandId(Number(e.target.value))}
                  className="w-full bg-[#111111] border border-gray-700 focus:border-purple-500 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none"
                >
                  <option value="">-- Selecciona la marca destino --</option>
                  {brands
                    .filter((b) => b.id !== mergingSourceBrand.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (ID: #{b.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setMergingSourceBrand(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isMerging || !mergeTargetBrandId}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Fusionando...
                    </>
                  ) : (
                    <>
                      Confirmar Fusión <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBMODAL: ELIMINAR MARCA */}
        {deletingBrand && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-20 animate-in fade-in duration-150">
            <div className="bg-[#1a1a1a] border-2 border-red-500/50 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg">Eliminar Marca</h4>
                  <p className="text-xs text-gray-400">
                    Solo se eliminará si ningún producto la está usando.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300">
                ¿Estás seguro de que deseas eliminar la marca{' '}
                <strong className="text-white underline font-mono">"{deletingBrand.name}"</strong>?
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingBrand(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Eliminando...
                    </>
                  ) : (
                    'Sí, Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BrandManagementModal;
