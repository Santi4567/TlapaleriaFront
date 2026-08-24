// src/types/user.ts

export interface User {
  id: number;
  name: string;
  username: string; // En tu JSON parece ser el correo (ej. juan@test.com)
  rol: string;
  isActive: boolean;
}

export interface PaginatedUsers {
  data: User[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface UsersApiResponse {
  success: boolean;
  message: string;
  data: PaginatedUsers;
}

