import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => API.post('/auth/register/', data)
export const login    = (data) => API.post('/auth/login/', data)
export const logout   = ()     => {
  const refresh = localStorage.getItem('refresh_token')
  return API.post('/auth/logout/', { refresh })
}
export const fetchMe  = ()     => API.get('/auth/me/')
export const updateProfile = (data) => API.put('/auth/me/', data)

// Products
export const fetchProducts = (params = {}) => API.get('/products/', { params })
export const fetchProduct  = (id)          => API.get(`/products/${id}/`)
export const createProduct = (data)        => API.post('/products/', data)
export const updateProduct = (id, data)    => API.patch(`/products/${id}/`, data)
export const deleteProduct = (id)          => API.delete(`/products/${id}/`)

// Orders
export const fetchOrders  = (params = {}) => API.get('/orders/', { params })
export const fetchOrder   = (id)          => API.get(`/orders/${id}/`)
export const createOrder  = (data)        => API.post('/orders/', data)
export const updateStatus = (id, status, note = '') => API.post(`/orders/${id}/status/`, { status, note })
export const deleteOrder  = (id)          => API.delete(`/orders/${id}/`)
export const updateNotes  = (id, notes)   => API.patch(`/orders/${id}/`, { notes })
export const cancelOrder  = (id)          => API.post(`/orders/${id}/cancel/`)

// Summary & Lists
export const fetchSummary   = ()  => API.get('/orders/summary/')
export const fetchCustomers = ()  => API.get('/customers/')
export const fetchUsers     = ()  => API.get('/users/')

// Admin: update user role
export const updateUserRole = (userId, role) => API.patch(`/users/${userId}/role/`, { role })

// Notifications & Reviews
export const fetchNotifications = () => API.get('/notifications/')
export const submitReview = (orderId, data) => API.post(`/orders/${orderId}/review/`, data)