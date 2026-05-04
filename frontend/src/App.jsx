import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ActivationPending from '@/pages/ActivationPending'
import ActivateAccount from '@/pages/ActivateAccount'
import AdminDashboard from '@/pages/AdminDashboard'
import CustomerDashboard from '@/pages/CustomerDashboard'
import OwnerDashboard from '@/pages/OwnerDashboard'
import Orders from '@/pages/Orders'
import CreateOrder from '@/pages/CreateOrder'
import OrderDetail from '@/pages/OrderDetail'
import Customers from '@/pages/Customers'
import Users from '@/pages/Users'
import ProductsPage from '@/pages/ProductsPage'
import Profile from '@/pages/Profile'


function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

// ── Dashboard Router ─────────────────────────────────────────
function DashboardComponent() {
  const { user } = useAuth()
  if (user?.role === 'admin')  return <AdminDashboard />
  if (user?.role === 'owner')  return <OwnerDashboard />
  return <CustomerDashboard />
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/activation-pending" element={<ActivationPending />} />
      <Route path="/activate/:uid/:token" element={<ActivateAccount />} />
      <Route path="/login"    element={!user ? <Login />    : <Navigate to="/profile" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/profile" replace />} />

      {/* Protected Routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/profile" replace />} />

        {/* Dashboard - role-based */}
        <Route path="dashboard" element={<DashboardComponent />} />

        {/* Orders - all authenticated users */}
        <Route path="orders" element={
          <PrivateRoute><Orders /></PrivateRoute>
        } />

        {/* Create Order - Admin only (customers use cart instead) */}
        <Route path="orders/create" element={
          <PrivateRoute roles={['admin']}><CreateOrder /></PrivateRoute>
        } />

        {/* Order Detail - all authenticated users */}
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

        {/* Products - Owner only */}
        <Route path="products" element={
          <PrivateRoute roles={['owner']}><ProductsPage /></PrivateRoute>
        } />

        {/* Profile - all authenticated users */}
        <Route path="profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />

        {/* Admin & Owner Routes */}
        <Route path="products" element={<PrivateRoute roles={['admin', 'owner']}><ProductsPage /></PrivateRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  )
}