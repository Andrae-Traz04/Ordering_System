import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
})

// Orders
export const fetchOrders = (params = {}) => API.get('/orders/', { params })
export const fetchOrder = (id) => API.get(`/orders/${id}/`)
export const createOrder = (data) => API.post('/orders/', data)
export const updateStatus = (id, status, note = '') =>
  API.post(`/orders/${id}/status/`, { status, note })
export const deleteOrder = (id) => API.delete(`/orders/${id}/`)
export const updateNotes = (id, notes) => API.patch(`/orders/${id}/`, { notes })

// Summary & Customers
export const fetchSummary = () => API.get('/orders/summary/')
export const fetchCustomers = () => API.get('/customers/')