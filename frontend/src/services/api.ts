import axios, { AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:88/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Remove invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  verifyToken: () =>
    api.get('/auth/verify'),
};

// Services API
export const servicosAPI = {
  getServicos: (params?: any) =>
    api.get('/servicos', { params }),
  
  getServicoById: (id: number) =>
    api.get(`/servicos/${id}`),
  
  createServico: (data: any) =>
    api.post('/servicos', data),
  
  updateServico: (id: number, data: any) =>
    api.put(`/servicos/${id}`, data),
  
  deleteServico: (id: number, motivo?: string) =>
    api.delete(`/servicos/${id}`, { data: { motivo } }),
  
  getEstatisticas: (periodo?: string) =>
    api.get('/servicos/estatisticas', { params: { periodo } }),
};

// Users API
export const usersAPI = {
  getUsers: () =>
    api.get('/users'),
  
  getUserById: (id: number) =>
    api.get(`/users/${id}`),
  
  createUser: (data: any) =>
    api.post('/users', data),
  
  updateUser: (id: number, data: any) =>
    api.put(`/users/${id}`, data),
  
  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),
};

// Deletion requests API
export const solicitacoesAPI = {
  getSolicitacoes: (status?: string) =>
    api.get('/solicitacoes', { params: { status } }),
  
  getSolicitacaoById: (id: number) =>
    api.get(`/solicitacoes/${id}`),
  
  processarSolicitacao: (id: number, acao: 'aprovar' | 'rejeitar', observacao?: string) =>
    api.put(`/solicitacoes/${id}/processar`, { acao, observacao }),
};

export default api;