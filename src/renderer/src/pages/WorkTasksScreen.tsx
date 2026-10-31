// src/pages/WorkTasksScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { workTaskService } from '../services/workTaskService';
import {
  CreateWorkTaskDto,
  UpdateWorkTaskDto,
  WorkTask,
  WorkTaskPriority,
  WorkTaskStatus,
  WorkWorkerItem
} from '../types/workTask';

type ViewTab = 'my-tasks' | 'manage-tasks';

export const WorkTasksScreen: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const canManageWork = Boolean(
    user?.rol === 'Admin' || (user?.permisos as any)?.WORK?.includes('add.work')
  );

  const [activeTab, setActiveTab] = useState<ViewTab>('my-tasks');

  // --- ESTADO: MIS TAREAS ---
  const [myTasks, setMyTasks] = useState<WorkTask[]>([]);
  const [isLoadingMy, setIsLoadingMy] = useState(true);
  const [myFilter, setMyFilter] = useState<'active' | 'completed' | 'all'>('active');

  // --- ESTADO: ADMINISTRAR TAREAS (add.work) ---
  const [allTasks, setAllTasks] = useState<WorkTask[]>([]);
  const [workers, setWorkers] = useState<WorkWorkerItem[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtros de administración
  const [filterWorkerId, setFilterWorkerId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Errores generales
  const [error, setError] = useState<string | null>(null);

  // --- MODAL: CREAR / EDITAR TAREA (add.work) ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<WorkTaskPriority>('Normal');
  const [formAssignedTo, setFormAssignedTo] = useState<number | ''>('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<WorkTaskStatus>('Pendiente');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);

  // --- MODAL: COMPLETAR TAREA CON NOTA DEL TRABAJADOR ---
  const [taskToComplete, setTaskToComplete] = useState<WorkTask | null>(null);
  const [workerNoteInput, setWorkerNoteInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- MODAL: CONFIRMAR QUITAR TAREA ---
  const [taskToDelete, setTaskToDelete] = useState<WorkTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMyTasks = useCallback(async () => {
    if (!token) return;
    setIsLoadingMy(true);
    try {
      const res = await workTaskService.getMyTasks(token);
      const json = await res.json();
      if (res.ok && json.success) {
        setMyTasks(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar mis tareas:', err);
    } finally {
      setIsLoadingMy(false);
    }
  }, [token]);

  const loadWorkers = useCallback(async () => {
    if (!token || !canManageWork) return;
    try {
      const res = await workTaskService.getAssignableWorkers(token);
      if (res.ok) {
        const json = await res.json();
        setWorkers(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar lista de trabajadores:', err);
    }
  }, [token, canManageWork]);

  const loadAllTasks = useCallback(async () => {
    if (!token || !canManageWork) return;
    setIsLoadingAll(true);
    setError(null);
    try {
      const res = await workTaskService.getAllTasks(
        {
          page: currentPage,
          pageSize: 50,
          assignedToUserId: filterWorkerId !== 'all' ? Number(filterWorkerId) : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          search: searchTerm.trim() || undefined
        },
        token
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron cargar las tareas del personal.');
      }
      const paged = json.data;
      setAllTasks(paged?.data || []);
      setTotalPages(Math.max(1, paged?.totalPages || 1));
      setTotalItems(paged?.totalItems || 0);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsLoadingAll(false);
    }
  }, [token, canManageWork, currentPage, filterWorkerId, filterStatus, filterPriority, searchTerm]);

  useEffect(() => {
    loadMyTasks();
    if (canManageWork) {
      loadWorkers();
    }
  }, [loadMyTasks, loadWorkers, canManageWork]);

  useEffect(() => {
    if (canManageWork && activeTab === 'manage-tasks') {
      loadAllTasks();
    }
  }, [canManageWork, activeTab, loadAllTasks]);

  // Escuchar eventos en tiempo real desde SignalR
  useEffect(() => {
    const handleRealtimeUpdate = () => {
      loadMyTasks();
      if (canManageWork && activeTab === 'manage-tasks') {
        loadAllTasks();
      }
    };
    window.addEventListener('worktasks-updated', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('worktasks-updated', handleRealtimeUpdate);
    };
  }, [loadMyTasks, loadAllTasks, canManageWork, activeTab]);

  const filteredMyTasks = useMemo(() => {
    return myTasks.filter((t) => {
      if (myFilter === 'active') {
        return t.status === 'Pendiente' || t.status === 'EnProgreso';
      }
      if (myFilter === 'completed') {
        return t.status === 'Completada';
      }
      return true;
    });
  }, [myTasks, myFilter]);

  const myCounts = useMemo(() => {
    const pending = myTasks.filter((t) => t.status === 'Pendiente').length;
    const inProgress = myTasks.filter((t) => t.status === 'EnProgreso').length;
    const completed = myTasks.filter((t) => t.status === 'Completada').length;
    return { pending, inProgress, completed };
  }, [myTasks]);

  // --- ACCIONES DEL TRABAJADOR ---
  const handleStartTask = async (task: WorkTask) => {
    if (!token) return;
    setError(null);
    try {
      const res = await workTaskService.updateTaskStatus(
        task.id,
        { status: 'EnProgreso', workerNotes: task.workerNotes || undefined },
        token
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudo iniciar la tarea.');
      }
      await loadMyTasks();
      if (canManageWork && activeTab === 'manage-tasks') await loadAllTasks();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la tarea.');
    }
  };

  const handleOpenCompleteModal = (task: WorkTask) => {
    setTaskToComplete(task);
    setWorkerNoteInput(task.workerNotes || '');
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToComplete || !token) return;
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await workTaskService.updateTaskStatus(
        taskToComplete.id,
        {
          status: 'Completada',
          workerNotes: workerNoteInput.trim() || undefined
        },
        token
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudo marcar como completada.');
      }
      setTaskToComplete(null);
      setWorkerNoteInput('');
      await loadMyTasks();
      if (canManageWork && activeTab === 'manage-tasks') await loadAllTasks();
    } catch (err: any) {
      setError(err.message || 'Error al completar la tarea.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- ACCIONES DE ADMINISTRACIÓN (add.work) ---
  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('Normal');
    setFormAssignedTo(workers.length > 0 ? workers[0].id : '');
    setFormDueDate('');
    setFormStatus('Pendiente');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (task: WorkTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority((task.priority as WorkTaskPriority) || 'Normal');
    setFormAssignedTo(task.assignedToUserId);
    setFormDueDate(task.dueDate ? task.dueDate.slice(0, 16) : '');
    setFormStatus((task.status as WorkTaskStatus) || 'Pendiente');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError(null);

    if (!formTitle.trim() || !formAssignedTo) {
      setFormError('Por favor ingresa el título de la tarea y selecciona un trabajador.');
      return;
    }

    setIsSavingForm(true);
    try {
      if (editingTask) {
        const payload: UpdateWorkTaskDto = {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          priority: formPriority,
          assignedToUserId: Number(formAssignedTo),
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
          status: formStatus
        };
        const res = await workTaskService.updateTask(editingTask.id, payload, token);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Error al modificar la tarea.');
        }
      } else {
        const payload: CreateWorkTaskDto = {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          priority: formPriority,
          assignedToUserId: Number(formAssignedTo),
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined
        };
        const res = await workTaskService.createTask(payload, token);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Error al asignar la tarea.');
        }
      }

      setIsFormModalOpen(false);
      await loadMyTasks();
      await loadAllTasks();
    } catch (err: any) {
      setFormError(err.message || 'Error de conexión.');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete || !token) return;
    setIsDeleting(true);
    try {
      const res = await workTaskService.deleteTask(taskToDelete.id, token);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudo quitar la tarea.');
      }
      setTaskToDelete(null);
      await loadMyTasks();
      await loadAllTasks();
    } catch (err: any) {
      setError(err.message || 'Error al quitar la tarea.');
      setTaskToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderPriorityBadge = (priority: string) => {
    const p = (priority || 'Normal').toLowerCase();
    if (p === 'urgente') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-red-900/30 text-red-400 border border-red-500/40 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          Urgente
        </span>
      );
    }
    if (p === 'baja') {
      return (
        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-gray-800 text-gray-300 border border-gray-700">
          Baja
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
        Normal
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || 'Pendiente').toLowerCase();
    if (s === 'completada') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-900/25 text-green-400 border border-green-500/30">
          Completada
        </span>
      );
    }
    if (s === 'enprogreso') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-900/25 text-blue-400 border border-blue-500/30">
          En Progreso
        </span>
      );
    }
    if (s === 'cancelada') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">
          Cancelada
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-900/25 text-yellow-400 border border-yellow-500/30">
        Pendiente
      </span>
    );
  };

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-800 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
             Centro de Tareas Operativas
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            {canManageWork
              ? 'Consulta tus actividades o asigna, modifica y supervisa las tareas del personal'
              : 'Revisa y actualiza el avance de las tareas asignadas a tu turno'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManageWork && (
            <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setActiveTab('my-tasks')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'my-tasks'
                    ? 'bg-brand-orange text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mis Tareas
                {myCounts.pending + myCounts.inProgress > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                      activeTab === 'my-tasks'
                        ? 'bg-black text-brand-orange'
                        : 'bg-brand-orange text-black'
                    }`}
                  >
                    {myCounts.pending + myCounts.inProgress}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage-tasks')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'manage-tasks'
                    ? 'bg-brand-orange text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Administrar Personal
              </button>
            </div>
          )}

          {canManageWork && (
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-brand-orange hover:bg-orange-500 text-black px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer"
            >
              <span>+</span> Asignar Tarea
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between shrink-0">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-xs underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 1: MIS TAREAS ASIGNADAS (Para cualquier trabajador)             */}
      {/* ===================================================================== */}
      {activeTab === 'my-tasks' && (
        <div className="flex-1 min-h-0 pt-6 flex flex-col space-y-4 overflow-hidden">
          {/* Barra superior de filtros y contadores rápidos */}
          <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMyFilter('active')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  myFilter === 'active'
                    ? 'bg-brand-orange text-black'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                Pendientes / En Curso ({myCounts.pending + myCounts.inProgress})
              </button>
              <button
                type="button"
                onClick={() => setMyFilter('completed')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  myFilter === 'completed'
                    ? 'bg-brand-orange text-black'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                Completadas ({myCounts.completed})
              </button>
              <button
                type="button"
                onClick={() => setMyFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  myFilter === 'all'
                    ? 'bg-brand-orange text-black'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                Todas ({myTasks.length})
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-yellow-400">● {myCounts.pending} por iniciar</span>
              <span className="text-blue-400">● {myCounts.inProgress} en progreso</span>
              <span className="text-green-400">● {myCounts.completed} terminadas</span>
            </div>
          </div>

          {/* Listado de Tarjetas de Mis Tareas */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {isLoadingMy ? (
              <div className="h-full flex flex-col items-center justify-center text-brand-text-muted py-16">
                <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Cargando tus tareas...</span>
              </div>
            ) : filteredMyTasks.length === 0 ? (
              <div className="h-full bg-[#121212] rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-3xl mb-4">
                  ✅
                </div>
                <h3 className="text-xl font-extrabold text-white">Sin tareas en esta vista</h3>
                <p className="text-brand-text-muted text-sm mt-1 max-w-md">
                  {myFilter === 'active'
                    ? '¡Excelente trabajo! No tienes tareas pendientes ni en curso en este momento.'
                    : 'No hay tareas registradas con este filtro.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMyTasks.map((task) => {
                  const isUrgent = (task.priority || '').toLowerCase() === 'urgente';
                  const isCompleted = task.status === 'Completada';
                  const isCancelled = task.status === 'Cancelada';

                  return (
                    <div
                      key={task.id}
                      className={`bg-[#121212] rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-lg ${
                        isUrgent && !isCompleted && !isCancelled
                          ? 'border-red-500/50 hover:border-red-500'
                          : 'border-gray-800 hover:border-brand-orange/50'
                      } ${isCompleted || isCancelled ? 'opacity-75' : ''}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          {renderPriorityBadge(task.priority)}
                          {renderStatusBadge(task.status)}
                        </div>

                        <h3 className="text-lg font-extrabold text-white leading-snug">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="text-sm text-gray-300 leading-relaxed bg-[#181818] p-3 rounded-xl border border-gray-800/80">
                            {task.description}
                          </p>
                        )}

                        <div className="text-xs text-brand-text-muted space-y-1 pt-1">
                          <div>
                            Asignada por: <strong className="text-gray-200">{task.assignedByUserName}</strong>
                          </div>
                          {task.dueDate && (
                            <div className="text-brand-orange font-bold">
                              📅 Fecha límite: {new Date(task.dueDate).toLocaleString('es-MX', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </div>
                          )}
                          {task.workerNotes && (
                            <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-gray-800 text-gray-300 italic">
                              <span className="text-[10px] font-bold uppercase text-brand-orange block not-italic">
                                Tu nota de reporte:
                              </span>
                              "{task.workerNotes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción del Trabajador */}
                      {!isCompleted && !isCancelled && (
                        <div className="pt-3 border-t border-gray-800 flex items-center gap-2">
                          {task.status === 'Pendiente' && (
                            <button
                              type="button"
                              onClick={() => handleStartTask(task)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-black border border-blue-500/30 font-extrabold text-xs transition-all cursor-pointer"
                            >
                              ▶ Iniciar Tarea
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(task)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-brand-orange hover:bg-orange-500 text-black font-extrabold text-xs transition-all shadow-[0_0_12px_rgba(255,90,0,0.25)] cursor-pointer"
                          >
                            ✓ Completar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: ADMINISTRAR PERSONAL (Solo usuarios con permiso add.work)    */}
      {/* ===================================================================== */}
      {canManageWork && activeTab === 'manage-tasks' && (
        <div className="flex-1 min-h-0 pt-6 flex flex-col space-y-4 overflow-hidden">
          {/* Filtros de Supervisión */}
          <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 flex flex-wrap gap-3 items-end justify-between shrink-0">
            <div className="flex flex-wrap gap-3 items-end flex-1">
              <div className="flex flex-col min-w-[200px] flex-1 max-w-xs">
                <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
                  Buscar tarea o trabajador
                </label>
                <input
                  type="text"
                  placeholder="Ej: Acomodar pasillo, Juan..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#161616] border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="flex flex-col min-w-[180px]">
                <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
                  Trabajador
                </label>
                <select
                  value={filterWorkerId}
                  onChange={(e) => {
                    setFilterWorkerId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange cursor-pointer"
                >
                  <option value="all">Todos los trabajadores</option>
                  {workers.map((w) => (
                    <option key={w.id} value={String(w.id)}>
                      {w.name} ({w.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col min-w-[150px]">
                <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="EnProgreso">En Progreso</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="flex flex-col min-w-[140px]">
                <label className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
                  Prioridad
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#161616] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange cursor-pointer"
                >
                  <option value="all">Todas</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Normal">Normal</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              {(searchTerm || filterWorkerId !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterWorkerId('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setCurrentPage(1);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Tareas del Personal */}
          <div className="flex-1 bg-[#121212] rounded-2xl border border-gray-800 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-gray-800">
                  <tr className="text-brand-text-muted text-xs font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Trabajador Asignado</th>
                    <th className="py-3.5 px-4">Tarea / Descripción</th>
                    <th className="py-3.5 px-4 text-center">Prioridad</th>
                    <th className="py-3.5 px-4">Fecha Límite</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4">Nota del Trabajador</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/70 text-sm">
                  {isLoadingAll ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-brand-text-muted">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold uppercase tracking-wider">Cargando tareas del personal...</span>
                        </div>
                      </td>
                    </tr>
                  ) : allTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-brand-text-muted">
                        No se encontraron tareas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    allTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-[#1a1a1a]/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white">{task.assignedToUserName}</div>
                          <div className="text-[11px] text-brand-text-muted">
                            Por: {task.assignedByUserName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="font-bold text-white">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex">{renderPriorityBadge(task.priority)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-gray-300 whitespace-nowrap">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleString('es-MX', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })
                            : 'Sin límite'}
                        </td>
                        <td className="py-3.5 px-4 text-center">{renderStatusBadge(task.status)}</td>
                        <td className="py-3.5 px-4 text-xs text-gray-300 italic max-w-xs">
                          {task.workerNotes || <span className="text-gray-600 not-italic">Sin notas</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="px-3 py-1.5 rounded-lg bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-black border border-brand-orange/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-5 py-3 bg-[#161616] border-t border-gray-800 flex items-center justify-between text-xs text-brand-text-muted shrink-0">
              <span>
                Mostrando <strong className="text-white">{allTasks.length}</strong> de{' '}
                <strong className="text-white">{totalItems}</strong> tareas
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoadingAll}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <span className="px-2 font-bold text-white">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoadingAll}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: COMPLETAR TAREA CON NOTA DEL TRABAJADOR                      */}
      {/* ===================================================================== */}
      {taskToComplete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#161616] rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-[#121212]">
              <div>
                <h3 className="text-lg font-extrabold text-white">Completar Tarea</h3>
                <p className="text-xs text-brand-text-muted">Puedes dejar una nota opcional de cierre</p>
              </div>
              <button
                onClick={() => setTaskToComplete(null)}
                className="w-8 h-8 rounded-xl bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="p-6 space-y-4">
              <div className="bg-[#111] border border-gray-800 rounded-2xl p-3.5">
                <div className="text-sm font-extrabold text-white">{taskToComplete.title}</div>
                {taskToComplete.description && (
                  <div className="text-xs text-gray-400 mt-1">{taskToComplete.description}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Nota / Observación del Trabajador (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Listo, quedaron 4 cajas acomodadas en el estante superior..."
                  value={workerNoteInput}
                  onChange={(e) => setWorkerNoteInput(e.target.value)}
                  maxLength={500}
                  className="w-full bg-[#111] border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskToComplete(null)}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-sm font-extrabold shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Guardando...' : '✓ Marcar Completada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CREAR / EDITAR TAREA (add.work)                              */}
      {/* ===================================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#161616] rounded-3xl w-full max-w-lg border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-7 py-5 border-b border-gray-800 flex justify-between items-center bg-[#121212]">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {editingTask ? 'Modificar Tarea Asignada' : 'Asignar Nueva Tarea'}
                </h2>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  El trabajador recibirá la actualización en tiempo real
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="p-7 space-y-5 overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="bg-red-900/20 border border-red-500/40 text-red-400 p-3.5 rounded-xl text-sm font-medium">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Acomodar pedido de Truper en pasillo 2"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                  Instrucciones / Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles específicos de lo que debe realizar el trabajador..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                    Asignar a Trabajador *
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange text-sm cursor-pointer"
                  >
                    <option value="" disabled>
                      Selecciona un trabajador...
                    </option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.rol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                    Prioridad *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as WorkTaskPriority)}
                    className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange text-sm cursor-pointer"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                    Fecha / Hora Límite (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange text-sm [color-scheme:dark]"
                  />
                </div>

                {editingTask && (
                  <div>
                    <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                      Estado de la Tarea
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as WorkTaskStatus)}
                      className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange text-sm cursor-pointer"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="EnProgreso">En Progreso</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSavingForm}
                  className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingForm}
                  className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-black text-sm font-extrabold shadow-[0_0_15px_rgba(255,90,0,0.3)] cursor-pointer disabled:opacity-50"
                >
                  {isSavingForm
                    ? 'Guardando...'
                    : editingTask
                    ? 'Guardar Cambios'
                    : 'Asignar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CONFIRMAR QUITAR TAREA                                       */}
      {/* ===================================================================== */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#161616] border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-xl font-bold">
                !
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">¿Quitar esta tarea?</h3>
                <p className="text-xs text-brand-text-muted">
                  Se retirará de la lista del trabajador asignado
                </p>
              </div>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 space-y-1 text-sm">
              <div className="font-bold text-white">{taskToDelete.title}</div>
              <div className="text-xs text-brand-text-muted">
                Asignada a: <strong className="text-gray-200">{taskToDelete.assignedToUserName}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-extrabold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Quitando...' : 'Sí, Quitar Tarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkTasksScreen;
