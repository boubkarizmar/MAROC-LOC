import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProprietaire: boolean;
  isLocataire: boolean;
  isTokenValid: () => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_EXPIRY_DAYS = 7;

function parseJwtExp(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '=');
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount using actual JWT exp claim
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const jwtExp = parseJwtExp(token);
      if (!jwtExp || Date.now() >= jwtExp) {
        logout();
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const isTokenValid = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const jwtExp = parseJwtExp(token);
    return !!jwtExp && Date.now() < jwtExp;
  }, []);

  const login = (token: string, userData: User, refreshToken?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('token_timestamp', Date.now().toString());
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    // Strip sensitive fields before storing in localStorage
    const safeUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
    localStorage.setItem('user', JSON.stringify(safeUser));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && isTokenValid(),
    isAdmin: user?.role === 'ADMIN',
    isProprietaire: user?.role === 'PROPRIETAIRE',
    isLocataire: user?.role === 'LOCATAIRE',
    isTokenValid,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
