import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/orders',    icon: '📦', label: 'Orders' },
  { to: '/customers', icon: '👥', label: 'Customers' },
]

export default function Layout() {
  const navigate = useNavigate()

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
          <div style={{ fontSize: 11, color: '#5a5a7a', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: '#7c7ca0', marginBottom: 4 }}>Workflow</div>
            <div>Pending → Processing</div>
            <div>Processing → Shipped</div>
            <div>Shipped → Completed</div>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <h1>Order Processing System</h1>
          <button className="btn btn-primary" onClick={() => navigate('/orders/create')}>
            + New Order
          </button>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}