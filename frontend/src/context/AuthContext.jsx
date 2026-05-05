import { createContext, useContext, useState } from 'react'
import { login as loginApi, logout as logoutApi, register as registerApi, updateProfile, fetchMe } from '@/api/ordersApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  // Normalize user shapes across different API responses so `user.role` is always available
  function normalizeUserPayload(payload) {
    // payload may be: { user: {...}, access, refresh } or a direct user object
    const raw = payload?.user ? payload.user : payload
    const role = raw?.profile?.role || raw?.role || 'customer'
    return {
      ...raw,
      role,
      // keep profile object available too
      profile: raw?.profile || null,
    }
  }

  const login = async (email, password) => {
    const res = await loginApi({ email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    const userData = normalizeUserPayload(res.data)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (payload) => {
    const res = await registerApi(payload)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    const userData = normalizeUserPayload(res.data)
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
    // updateProfile may return user object or wrapped object
    const userData = normalizeUserPayload(res.data)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const refreshUser = async () => {
    try {
      const res = await fetchMe()
      const userData = normalizeUserPayload(res.data)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Failed to refresh user', error)
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}