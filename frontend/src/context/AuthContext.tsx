import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';
import { clearSession, getStoredUser, getToken, saveSession } from '../lib/storage';
import type { AuthResponse, AuthState, User } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const applySession = (response: AuthResponse) => {
    saveSession(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      applySession(response);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      applySession(response);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: token !== null && user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
