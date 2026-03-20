import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import AdminDashboard from '@/pages/AdminDashboard'
import CustomerDashboard from '@/pages/CustomerDashboard'
import OwnerDashboard from '@/pages/OwnerDashboard'
import Orders from '@/pages/Orders'
import CreateOrder from '@/pages/CreateOrder'
import OrderDetail from '@/pages/OrderDetail'
import Customers from '@/pages/Customers'
import Users from '@/pages/Users'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

// ── Dashboard Router ──────────────────────────────────────────
// Routes to different dashboards based on user role:
// - Admin:    AdminDashboard (manage all orders, full system access)
// - Owner:    OwnerDashboard (manage orders and customers)
// - Customer: CustomerDashboard (view own orders only)
function DashboardComponent() {
  const { user } = useAuth()
  
  if (user?.role === 'admin') {
    return <AdminDashboard />
  }
  
  if (user?.role === 'owner') {
    return <OwnerDashboard />
  }
  
  // Default for customers and other roles
  return <CustomerDashboard />
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login"    element={!user ? <Login />    : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <PrivateRoute><Layout /></PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard - Role-based routing */}
        {/* ✅ Admin → AdminDashboard (all orders, full control) */}
        {/* ✅ Owner → OwnerDashboard (business dashboard) */}
        {/* ✅ Customer → CustomerDashboard (personal orders) */}
        <Route path="dashboard" element={<DashboardComponent />} />

        {/* Orders - All authenticated users can view */}
        <Route path="orders" element={
          <PrivateRoute><Orders /></PrivateRoute>
        } />

        {/* Create Order - Customer & Admin only (NOT Owner) */}
        <Route path="orders/create" element={
          <PrivateRoute roles={['customer', 'admin']}><CreateOrder /></PrivateRoute>
        } />

        {/* Order Detail - All authenticated users can view */}
        <Route path="orders/:id" element={
          <PrivateRoute><OrderDetail /></PrivateRoute>
        } />

        {/* Customers - Owner & Admin only */}
        <Route path="customers" element={
          <PrivateRoute roles={['owner', 'admin']}><Customers /></PrivateRoute>
        } />

        {/* Users Management - Admin only */}
        <Route path="users" element={
          <PrivateRoute roles={['admin']}><Users /></PrivateRoute>
        } />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}