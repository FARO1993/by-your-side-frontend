export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

// Espejo de ErrorResponse del backend (GlobalExceptionHandler)
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  author: UserSummary;
  content: string;
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
}

// Espejo de Page<T> de Spring Data (lo que devuelve GET /api/posts/feed)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // pagina actual, 0-indexed
  size: number;
  last: boolean;
}

export interface CreatePostRequest {
  content: string;
  visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
}