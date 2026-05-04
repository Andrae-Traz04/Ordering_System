import { createContext, useContext, useState } from 'react'
import { login as loginApi, logout as logoutApi, register as registerApi, updateProfile, fetchMe } from '@/api/ordersApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email, password) => {
    const res = await loginApi({ email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    // Flatten user data: extract role from profile
    const userData = {
      ...res.data.user,
      role: res.data.user.profile?.role || 'customer'
    }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (payload) => {
    const res = await registerApi(payload)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    // Flatten user data: extract role from profile
    const userData = {
      ...res.data.user,
      role: res.data.user.profile?.role || 'customer'
    }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try { await logoutApi() } catch {}
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = async (data) => {
    const res = await updateProfile(data)
    localStorage.setItem('user', JSON.stringify(res.data))
    setUser(res.data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}