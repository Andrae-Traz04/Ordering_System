import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, logout as logoutApi, register as registerApi, updateProfile, fetchMe } from '@/api/ordersApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    const hasToken = Boolean(localStorage.getItem('access_token'))
    return saved && hasToken ? JSON.parse(saved) : null
  })
  const [authChecked, setAuthChecked] = useState(false)

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token && user) {
      // Try to validate token by calling /me endpoint
      refreshUser().finally(() => setAuthChecked(true))
    } else {
      if (!token && user) {
        // Clear invalid state
        setUser(null)
        localStorage.removeItem('user')
      }
      setAuthChecked(true)
    }
  }, [])

  // Normalize user shapes across different API responses so `user.role` is always available
  function normalizeUserPayload(payload) {
    // payload may be: { user: {...}, access, refresh } or a direct user object
    const raw = payload?.user ? payload.user : payload
    const role = raw?.profile?.role || raw?.role || 'user'
    return {
      ...raw,
      role,
      // keep profile object available too
      profile: raw?.profile || null,
    }
  }

const login = async (email, password) => {
     const res = await loginApi({ email, password })
     // Handle 403 — account not activated
     if (res.data?.detail?.includes?.('not activated')) {
       return { error: res.data.detail }
     }
     localStorage.setItem('access_token', res.data.access)
     localStorage.setItem('refresh_token', res.data.refresh)
     const userData = normalizeUserPayload(res.data)
     localStorage.setItem('user', JSON.stringify(userData))
     setUser(userData)
     return userData
   }

  const register = async (payload) => {
    const res = await registerApi(payload)
    const access = res.data?.access
    const refresh = res.data?.refresh
    if (access && refresh) {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      const userData = normalizeUserPayload(res.data)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    }
    return res.data?.user || res.data
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
       const token = localStorage.getItem('access_token')
       if (!token) {
         setUser(null)
         return null
       }
       const res = await fetchMe()
       const userData = normalizeUserPayload(res.data)
       localStorage.setItem('user', JSON.stringify(userData))
       setUser(userData)
       return userData
     } catch (error) {
       console.error('Failed to refresh user', error)
       // Clear invalid tokens on failure
       localStorage.removeItem('access_token')
       localStorage.removeItem('refresh_token')
       localStorage.removeItem('user')
       setUser(null)
       return null
     }
   }

  return (
    <AuthContext.Provider value={{ user, authChecked, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}