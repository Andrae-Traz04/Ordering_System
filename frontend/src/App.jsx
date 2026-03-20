import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import OwnerDashboard from './pages/OwnerDashboard'
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

// Dashboard router - shows OwnerDashboard for owners, regular Dashboard for others
function DashboardComponent() {
  const { user } = useAuth()
  
  if (user?.role === 'owner') {
    return <OwnerDashboard />
  }
  
  return <Dashboard />
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login"    element={!user ? <Login />    : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />

      <Route path="/" element={
        <PrivateRoute><Layout /></PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard - Routes to OwnerDashboard for owners, regular Dashboard for others */}
        <Route path="dashboard" element={<DashboardComponent />} />

        <Route path="orders" element={
          <PrivateRoute><Orders /></PrivateRoute>
        } />

        <Route path="orders/create" element={
          <PrivateRoute roles={['customer', 'owner', 'admin']}><CreateOrder /></PrivateRoute>
        } />

        <Route path="orders/:id" element={
          <PrivateRoute><OrderDetail /></PrivateRoute>
        } />

        <Route path="customers" element={
          <PrivateRoute roles={['owner', 'admin']}><Customers /></PrivateRoute>
        } />

        <Route path="users" element={
          <PrivateRoute roles={['admin']}><Users /></PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}