// src/types/workTask.ts

export type WorkTaskPriority = 'Baja' | 'Normal' | 'Urgente';
export type WorkTaskStatus = 'Pendiente' | 'EnProgreso' | 'Completada' | 'Cancelada';

export interface WorkTask {
  id: number;
  title: string;
  description?: string | null;
  priority: WorkTaskPriority | string;
  status: WorkTaskStatus | string;
  assignedToUserId: number;
  assignedToUserName: string;
  assignedByUserId: number;
  assignedByUserName: string;
  dueDate?: string | null;
  workerNotes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkTaskDto {
  title: string;
  description?: string;
  priority: WorkTaskPriority | string;
  assignedToUserId: number;
  dueDate?: string;
}

export interface UpdateWorkTaskDto {
  title: string;
  description?: string;
  priority: WorkTaskPriority | string;
  assignedToUserId: number;
  dueDate?: string;
  status?: WorkTaskStatus | string;
  workerNotes?: string;
}

export interface UpdateWorkTaskStatusDto {
  status: WorkTaskStatus | string;
  workerNotes?: string;
}

export interface WorkWorkerItem {
  id: number;
  name: string;
  username: string;
  rol: string;
}

export interface PagedWorkTasksResponse {
  data: WorkTask[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
