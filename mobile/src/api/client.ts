import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const API_BASE_URL = 'http://10.0.2.2:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// Helper function to get token based on platform
const getToken = async () => {
  if (Platform.OS === 'web') {
    // For web, use localStorage
    return localStorage.getItem('access_token')
  } else {
    // For native, use SecureStore
    return await SecureStore.getItemAsync('access_token')
  }
}

// Helper function to delete tokens based on platform
const deleteTokens = async () => {
  if (Platform.OS === 'web') {
    // For web, use localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  } else {
    // For native, use SecureStore
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    await SecureStore.deleteItemAsync('user')
  }
}

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await deleteTokens()
    }
    return Promise.reject(err)
  }
)

export const register = (data: any) => api.post('/auth/register/', data)
export const activateAccount = (uid: string, token: string) => api.post(`/auth/activate/${uid}/${token}/`)
export const login = (data: any) => api.post('/auth/login/', data)
export const logout = (refresh: string) => api.post('/auth/logout/', { refresh })
export const fetchMe = () => api.get('/auth/me/')

// Normalize user data - extract role from profile
export const normalizeUser = (payload: any) => {
  const raw = payload?.user ? payload.user : payload
  const role = raw?.profile?.role || raw?.role || 'user'
  return { ...raw, role, profile: raw?.profile || null }
}

export const updateProfile = (data: any) => api.put('/auth/me/', data)

export const fetchProducts = (params = {}) => api.get('/products/', { params })
export const fetchProduct = (id: number) => api.get(`/products/${id}/`)
export const createProduct = (data: any) => api.post('/products/', data)
export const updateProduct = (id: number, data: any) => api.patch(`/products/${id}/`, data)
export const deleteProduct = (id: number) => api.delete(`/products/${id}/`)

export const fetchOrders = (params = {}) => api.get('/orders/', { params })
export const fetchOrder = (id: number) => api.get(`/orders/${id}/`)
export const createOrder = (data: any) => api.post('/orders/', data)
export const updateStatus = (id: number, status: string, note = '') => api.post(`/orders/${id}/status/`, { status, note })
export const deleteOrder = (id: number) => api.delete(`/orders/${id}/`)
export const updateNotes = (id: number, notes: string) => api.patch(`/orders/${id}/`, { notes })
export const cancelOrder = (id: number) => api.post(`/orders/${id}/cancel/`)

export const fetchSummary = () => api.get('/orders/summary/')
export const fetchCustomers = () => api.get('/customers/')
export const fetchUsers = () => api.get('/users/')
export const updateUserRole = (userId: number, role: string) => api.patch(`/users/${userId}/role/`, { role })

export const fetchNotifications = () => api.get('/notifications/')
export const submitReview = (orderId: number, data: any) => api.post(`/orders/${orderId}/review/`, data)

export const createOwnerApplication = (data: any) => api.post('/owner-applications/create/', data)
export const fetchOwnerApplications = () => api.get('/owner-applications/')
export const fetchOwnerApplication = (id: number) => api.get(`/owner-applications/${id}/`)
export const reviewOwnerApplication = (id: number, data: any) => api.post(`/owner-applications/${id}/review/`, data)

export const sendChatMessage = (message: string) => api.post('/chatbot/', { message })
export const fetchChatbotInfo = () => api.get('/chatbot/info/')