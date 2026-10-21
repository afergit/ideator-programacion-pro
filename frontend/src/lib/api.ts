import axios from 'axios';
import { clearSession, getToken } from './storage';

interface ApiErrorBody {
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      getToken() !== null
    ) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
      return Object.values(data.fieldErrors).join(' ');
    }

    if (data?.message) {
      return data.message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'La solicitud tardó demasiado. Intenta nuevamente.';
    }

    if (!error.response) {
      return 'No se pudo conectar con el backend. Verifica que esté corriendo en http://localhost:8080.';
    }
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}
