import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from '@/components/NotificationBell'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard',     icon: '📊', label: 'Dashboard', roles: ['customer', 'owner', 'admin'] },
    { to: '/orders',        icon: '📦', label: 'Orders',    roles: ['customer', 'owner', 'admin'] },
    { to: '/orders/create', icon: '➕', label: 'New Order', roles: ['customer', 'owner', 'admin'] },
    { to: '/customers',     icon: '👥', label: 'Customers', roles: ['owner', 'admin'] },
    { to: '/users',         icon: '🔐', label: 'Users',     roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role))

  const roleBadgeColor = {
    customer: '#2563eb',
    owner:    '#d97706',
    admin:    '#059669',
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-brand">
          <h2>⚙️ OrderFlow</h2>
          <p>Workflow System</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #2d2d4e' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#7c7ca0', marginBottom: 4 }}>Logged in as</div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{user?.username}</div>
            <span style={{
              display: 'inline-block',
              marginTop: 4,
              background: roleBadgeColor[user?.role] || '#555',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              textTransform: 'uppercase',
            }}>
              {user?.role}
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#5a5a7a', lineHeight: 1.8, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: '#7c7ca0', marginBottom: 4 }}>Workflow</div>
            <div>Pending → Processing</div>
            <div>Processing → Shipped</div>
            <div>Shipped → Completed</div>
          </div>

          <button
            className="btn btn-danger btn-sm"
            style={{ width: '100%' }}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <h1>Order Processing System</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell />
            <button className="btn btn-primary" onClick={() => navigate('/orders/create')}>
              + New Order
            </button>
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}