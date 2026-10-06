import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'ideator_auth_token';
const STORAGE_KEY_USER = 'ideator_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restaurar sesión desde localStorage si existe
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error restaurando sesión:', e);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    // Simulación de Google SSO (Listo para conectar con Google OAuth2 / Backend)
    await new Promise((res) => setTimeout(res, 800));

    const mockGoogleUser: User = {
      id: 'usr_google_101',
      name: 'Desarrollador UAI',
      email: 'alumno@uai.cl',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'ADMIN',
    };

    const mockToken = 'jwt_sample_token_' + Date.now();

    setUser(mockGoogleUser);
    setToken(mockToken);
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockGoogleUser));
    setIsLoading(false);
  };

  const loginWithCredentials = async (email: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600));

    const standardUser: User = {
      id: 'usr_std_' + Math.floor(Math.random() * 1000),
      name: email.split('@')[0],
      email: email,
      role: 'MEMBER',
    };

    const mockToken = 'jwt_sample_token_' + Date.now();

    setUser(standardUser);
    setToken(mockToken);
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(standardUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        loginWithGoogle,
        loginWithCredentials,
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
