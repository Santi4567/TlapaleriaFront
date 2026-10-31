// src/services/workTaskService.ts
import { fetchWithAuth } from '../utils/fetchClient';
import {
  CreateWorkTaskDto,
  UpdateWorkTaskDto,
  UpdateWorkTaskStatusDto
} from '../types/workTask';

const API_URL = `${import.meta.env.VITE_API_URL}/WorkTasks`;

const buildHeaders = (token?: string | null, includeJsonContentType = false): Record<string, string> => {
  const headers: Record<string, string> = {
    accept: 'application/json'
  };
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  const clean: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      clean[k] = String(v);
    }
  });
  return new URLSearchParams(clean).toString();
};

export const workTaskService = {
  getMyTasks: async (token?: string | null, status?: string) => {
    const query = buildQueryString(status ? { status } : undefined);
    const url = query ? `${API_URL}/my?${query}` : `${API_URL}/my`;
    return fetchWithAuth(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  updateTaskStatus: async (id: number, data: UpdateWorkTaskStatusDto, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/${id}/status`, {
      method: 'PUT',
      headers: buildHeaders(token, true),
      body: JSON.stringify(data)
    });
  },

  getAllTasks: async (params?: Record<string, any>, token?: string | null) => {
    const query = buildQueryString(params);
    const url = query ? `${API_URL}?${query}` : API_URL;
    return fetchWithAuth(url, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  getAssignableWorkers: async (token?: string | null) => {
    return fetchWithAuth(`${API_URL}/workers`, {
      method: 'GET',
      headers: buildHeaders(token)
    });
  },

  createTask: async (data: CreateWorkTaskDto, token?: string | null) => {
    return fetchWithAuth(API_URL, {
      method: 'POST',
      headers: buildHeaders(token, true),
      body: JSON.stringify(data)
    });
  },

  updateTask: async (id: number, data: UpdateWorkTaskDto, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: buildHeaders(token, true),
      body: JSON.stringify(data)
    });
  },

  deleteTask: async (id: number, token?: string | null) => {
    return fetchWithAuth(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token)
    });
  }
};
