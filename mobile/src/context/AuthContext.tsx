import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'
import { fetchMe, logout as apiLogout } from '../api/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, refreshToken: string, userData: User) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token')
        if (token) {
          const res = await fetchMe()
          setUser(res.data)
        }
      } catch (error) {
        await AsyncStorage.removeItem('access_token')
        await AsyncStorage.removeItem('refresh_token')
        await AsyncStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const login = async (token: string, refreshToken: string, userData: User) => {
    await AsyncStorage.setItem('access_token', token)
    await AsyncStorage.setItem('refresh_token', refreshToken)
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token')
      if (refreshToken) {
        await apiLogout(refreshToken)
      }
    } catch (e) {}
    await AsyncStorage.removeItem('access_token')
    await AsyncStorage.removeItem('refresh_token')
    await AsyncStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}