import { api } from '../lib/api';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types/auth';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/v1/auth/login', payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/v1/auth/register', payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/v1/auth/me');
    return data;
  },
};
