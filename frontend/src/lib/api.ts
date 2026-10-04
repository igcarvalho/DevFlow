const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('devflow_token');
}

export function setToken(token: string) {
  localStorage.setItem('devflow_token', token);
}

export function clearToken() {
  localStorage.removeItem('devflow_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let message = 'Erro inesperado';
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // ignora erro de parse
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- Types ----

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  email: string | null;
  full_name: string | null;
}

export interface ProjectWithMembers extends Project {
  members: ProjectMember[];
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_key: string;
  file_size: number;
  mime_type: string;
  extracted_text: string | null;
  processing_error: string | null;
  created_by: string;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  current_version_id: string | null;
  status: DocumentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithVersions extends Document {
  versions: DocumentVersion[];
}

// ---- Endpoints ----

export async function login(email: string, password: string): Promise<void> {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);

  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Email ou senha inválidos');
  }

  const data = await response.json();
  setToken(data.access_token);
}

export async function register(
  email: string,
  fullName: string,
  password: string,
): Promise<void> {
  await api.post<User>('/api/v1/auth/register', {
    email,
    full_name: fullName,
    password,
  });
}

export const projectsApi = {
  list: () => api.get<Project[]>('/api/v1/projects'),
  get: (id: string) => api.get<ProjectWithMembers>(`/api/v1/projects/${id}`),
  create: (name: string, description?: string) =>
    api.post<Project>('/api/v1/projects', { name, description }),
  addMember: (projectId: string, email: string, role = 'member') =>
    api.post<ProjectMember>(`/api/v1/projects/${projectId}/members`, {
      email,
      role,
    }),
};

export const documentsApi = {
  list: (projectId: string) =>
    api.get<Document[]>(`/api/v1/projects/${projectId}/documents`),
  get: (projectId: string, documentId: string) =>
    api.get<DocumentWithVersions>(
      `/api/v1/projects/${projectId}/documents/${documentId}`,
    ),
  upload: (
    projectId: string,
    file: File,
    title: string,
    description?: string,
  ) => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    if (description) form.append('description', description);
    return api.post<Document>(
      `/api/v1/projects/${projectId}/documents`,
      form,
    );
  },
  uploadVersion: (projectId: string, documentId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<DocumentVersion>(
      `/api/v1/projects/${projectId}/documents/${documentId}/versions`,
      form,
    );
  },
  remove: (projectId: string, documentId: string) =>
    api.delete<void>(`/api/v1/projects/${projectId}/documents/${documentId}`),
};
