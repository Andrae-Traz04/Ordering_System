export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'customer' | 'owner' | 'admin'
  profile_image?: string
  phone?: string
  address?: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image?: string
}

export interface Order {
  id: number
  customer_name: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  created_at: string
  items: OrderItem[]
  notes?: string
}

export interface OrderItem {
  id: number
  product: Product
  quantity: number
  price: number
}

export interface Notification {
  id: number
  message: string
  read: boolean
  created_at: string
}

export interface Summary {
  total_orders: number
  total_revenue: number
  pending_orders: number
  completed_orders: number
}