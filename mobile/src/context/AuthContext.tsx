import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { fetchMe, normalizeUser, setAuthToken } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const saveToStorage = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  };

  const getFromStorage = async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  };

  const removeFromStorage = async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  };

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const accessToken = await getFromStorage('access_token');
        const userDataString = await getFromStorage('user');

        if (!accessToken) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        // Optimistically set token, then validate via /auth/me/
        setAuthToken(accessToken);

        if (userDataString && userDataString !== 'undefined') {
          const userData: User = JSON.parse(userDataString);
          setUser(userData);
        }

        try {
          const res = await fetchMe();
          const me = res.data as any;
          const normalizedMe = normalizeUser(me);
          await saveToStorage('user', JSON.stringify(normalizedMe));
          setUser(normalizedMe);
          setIsAuthenticated(true);
        } catch (_e: any) {
          // Token invalid (ex: wrong token type / stale token). Clear storage.
          await removeFromStorage('access_token');
          await removeFromStorage('refresh_token');
          await removeFromStorage('user');
          setAuthToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (_error) {
        // Fallback: if anything goes wrong, clear auth.
        await removeFromStorage('access_token');
        await removeFromStorage('refresh_token');
        await removeFromStorage('user');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    try {
      await saveToStorage('access_token', accessToken);
      await saveToStorage('refresh_token', refreshToken);
      await saveToStorage('user', JSON.stringify(userData));
      setAuthToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  const logout = async () => {
    try {
      await removeFromStorage('access_token');
      await removeFromStorage('refresh_token');
      await removeFromStorage('user');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

