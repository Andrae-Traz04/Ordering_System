import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
})

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Token ${token}`
  return config
})

// Redirect to login on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => API.post('/auth/register/', data)
export const login    = (data) => API.post('/auth/login/', data)
export const logout   = ()     => API.post('/auth/logout/')
export const fetchMe  = ()     => API.get('/auth/me/')

// Orders
export const fetchOrders  = (params = {}) => API.get('/orders/', { params })
export const fetchOrder   = (id)          => API.get(`/orders/${id}/`)
export const createOrder  = (data)        => API.post('/orders/', data)
export const updateStatus = (id, status, note = '') =>
  API.post(`/orders/${id}/status/`, { status, note })
export const deleteOrder  = (id)          => API.delete(`/orders/${id}/`)
export const updateNotes  = (id, notes)   => API.patch(`/orders/${id}/`, { notes })

// Summary & Customers
export const fetchSummary   = ()  => API.get('/orders/summary/')
export const fetchCustomers = ()  => API.get('/customers/')
export const fetchUsers     = ()  => API.get('/users/')