import * as SecureStore from 'expo-secure-store'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '../types'
import { fetchMe, logout as apiLogout, normalizeUser } from '../api/client'
import { Platform } from 'react-native'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, refreshToken: string, userData: User) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const normalizeUserPayload = (payload: any) => {
  const raw = payload?.user ? payload.user : payload
  const role = raw?.profile?.role || raw?.role || 'user'
  return { ...raw, role, profile: raw?.profile || null }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

   useEffect(() => {
     const loadUser = async () => {
       try {
         let token
         if (Platform.OS === 'web') {
           // For web, use localStorage as fallback
           token = localStorage.getItem('access_token')
         } else {
           // For native, use SecureStore
           token = await SecureStore.getItemAsync('access_token')
         }
         if (token) {
           const res = await fetchMe()
           setUser(normalizeUserPayload(res.data))
         }
       } catch (error) {
         // Clear tokens on error
         if (Platform.OS === 'web') {
           localStorage.removeItem('access_token')
           localStorage.removeItem('refresh_token')
           localStorage.removeItem('user')
         } else {
           await SecureStore.deleteItemAsync('access_token')
           await SecureStore.deleteItemAsync('refresh_token')
           await SecureStore.deleteItemAsync('user')
         }
       } finally {
         setLoading(false)
       }
     }
     loadUser()
   }, [])

   const login = async (token: string, refreshToken: string, userData: User) => {
     const normalizedUser = normalizeUserPayload(userData)
     if (Platform.OS === 'web') {
       // For web, use localStorage
       localStorage.setItem('access_token', token)
       localStorage.setItem('refresh_token', refreshToken)
       localStorage.setItem('user', JSON.stringify(normalizedUser))
     } else {
       // For native, use SecureStore
       await SecureStore.setItemAsync('access_token', token)
       await SecureStore.setItemAsync('refresh_token', refreshToken)
       await SecureStore.setItemAsync('user', JSON.stringify(normalizedUser))
     }
     setUser(normalizedUser)
   }

   const logout = async () => {
     try {
       let refreshToken
       if (Platform.OS === 'web') {
         // For web, get from localStorage
         refreshToken = localStorage.getItem('refresh_token')
       } else {
         // For native, get from SecureStore
         refreshToken = await SecureStore.getItemAsync('refresh_token')
       }
       if (refreshToken) {
         await apiLogout(refreshToken)
       }
     } catch (e) {}
     // Clear tokens
     if (Platform.OS === 'web') {
       localStorage.removeItem('access_token')
       localStorage.removeItem('refresh_token')
       localStorage.removeItem('user')
     } else {
       await SecureStore.deleteItemAsync('access_token')
       await SecureStore.deleteItemAsync('refresh_token')
       await SecureStore.deleteItemAsync('user')
     }
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