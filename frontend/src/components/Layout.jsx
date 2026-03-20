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

  // Role-based navigation items
  const roleNavItems = {
    customer: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { to: '/orders', icon: '📋', label: 'Orders' },
      { to: '/orders/create', icon: '+', label: 'New Order' },
    ],
    owner: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { to: '/orders', icon: '📋', label: 'Orders' },
      { to: '/customers', icon: '👥', label: 'Customers' },
    ],
    admin: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { to: '/orders', icon: '📋', label: 'Orders' },
      { to: '/orders/create', icon: '+', label: 'New Order' },
      { to: '/customers', icon: '👥', label: 'Customers' },
      { to: '/users', icon: '🔑', label: 'Users' },
    ],
  }

  const navItems = roleNavItems[user?.role] || roleNavItems.customer

  const WORKFLOW = ['Pending', 'Processing', 'Shipped', 'Completed']
  const WORKFLOW_DOTS = {
    Pending:    '#F59E0B',
    Processing: '#6C47FF',
    Shipped:    '#9B6DFF',
    Completed:  '#10B981',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #F7F4FF;
          color: #2D1F6E;
        }

        .amu-layout {
          display: flex;
          min-height: 100vh;
        }

        /* ── Sidebar ─────────────────────────────── */
        .amu-sidebar {
          width: 224px;
          min-height: 100vh;
          background: #fff;
          border-right: 1.5px solid #F0EBFF;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          box-shadow: 4px 0 20px rgba(155,109,255,0.06);
          flex-shrink: 0;
          z-index: 10;
        }

        .amu-brand {
          padding: 24px 20px 18px;
          border-bottom: 1.5px solid #F7F4FF;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .amu-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #C4A8FF 0%, #7C3AED 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .amu-brand-name {
          font-weight: 800;
          font-size: 15px;
          color: #2D1F6E;
          line-height: 1.2;
        }

        .amu-brand-sub {
          font-size: 10px;
          color: #C4B8E8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Nav ─────────────────────────────────── */
        .amu-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .amu-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border-radius: 12px;
          border: none;
          border-left: 3px solid transparent;
          background: transparent;
          color: #9B8FC0;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.15s;
        }

        .amu-nav-item:hover {
          background: #FAF8FF;
          color: #7C3AED;
        }

        .amu-nav-item.active {
          background: #F3EEFF;
          color: #7C3AED;
          font-weight: 700;
          border-left: 3px solid #9B6DFF;
        }

        .amu-nav-icon {
          font-size: 15px;
          flex-shrink: 0;
        }

        /* ── Role Badge ──────────────────────────── */
        .amu-role-badge {
          margin: 0 10px 14px;
          background: #F7F4FF;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1.5px solid #EDE9FE;
          text-align: center;
        }

        .amu-role-label {
          font-size: 9px;
          font-weight: 700;
          color: #C4B8E8;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .amu-role-text {
          font-size: 13px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .amu-role-customer { color: #3B82F6; }
        .amu-role-owner { color: #EA580C; }
        .amu-role-admin { color: #10B981; }

        /* ── Workflow legend ─────────────────────── */
        .amu-workflow {
          margin: 0 10px 12px;
          background: #F7F4FF;
          border-radius: 14px;
          padding: 12px 14px;
          border: 1.5px solid #EDE9FE;
        }

        .amu-workflow-title {
          font-size: 10px;
          font-weight: 700;
          color: #9B6DFF;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .amu-workflow-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
        }

        .amu-workflow-row:last-child { margin-bottom: 0; }

        .amu-workflow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .amu-workflow-label {
          font-size: 12px;
          font-weight: 600;
          flex: 1;
        }

        .amu-workflow-arrow {
          font-size: 11px;
          color: #D8D0F0;
        }

        /* ── User footer ─────────────────────────── */
        .amu-user {
          margin: 0 10px 20px;
          background: #FAF8FF;
          border-radius: 12px;
          padding: 11px 12px;
          border: 1.5px solid #F0EBFF;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .amu-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #C4A8FF, #7C3AED);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          flex-shrink: 0;
        }

        .amu-username {
          font-size: 13px;
          font-weight: 700;
          color: #2D1F6E;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .amu-role {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .amu-logout-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: #D0C8EE;
          cursor: pointer;
          font-size: 16px;
          flex-shrink: 0;
          transition: color 0.15s;
          padding: 4px;
          border-radius: 6px;
        }

        .amu-logout-btn:hover { color: #9B6DFF; }

        /* ── Main area ───────────────────────────── */
        .amu-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #F7F4FF;
        }

        /* ── Topbar ──────────────────────────────── */
        .amu-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 60px;
          background: #fff;
          border-bottom: 1.5px solid #F0EBFF;
          box-shadow: 0 2px 12px rgba(155,109,255,0.05);
          position: sticky;
          top: 0;
          z-index: 9;
          flex-shrink: 0;
        }

        .amu-topbar-title {
          font-size: 15px;
          font-weight: 800;
          color: #2D1F6E;
          letter-spacing: -0.01em;
        }

        .amu-topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .amu-new-order-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #9B6DFF 0%, #7C3AED 100%);
          border: none;
          border-radius: 12px;
          padding: 9px 18px;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(124,58,237,0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .amu-new-order-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 20px rgba(124,58,237,0.35);
        }

        /* ── Content ─────────────────────────────── */
        .amu-content {
          flex: 1;
          padding: 28px 32px;
          overflow-y: auto;
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #F3EEFF; }
        ::-webkit-scrollbar-thumb { background: #C4A8FF; border-radius: 4px; }
      `}</style>

      <div className="amu-layout">

        {/* ── Sidebar ── */}
        <aside className="amu-sidebar">

          {/* Brand */}
          <div className="amu-brand">
            <div className="amu-brand-icon">✨</div>
            <div>
              <div className="amu-brand-name">Ordering</div>
              <div className="amu-brand-sub">Workflow System</div>
            </div>
          </div>

          {/* Nav links - Role Based */}
          <nav className="amu-nav">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `amu-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="amu-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Role Badge */}
          <div className="amu-role-badge">
            <div className="amu-role-label">Current Role</div>
            <div className={`amu-role amu-role-${user?.role || 'customer'}`}>
              {user?.role || 'Customer'}
            </div>
          </div>

          {/* Workflow legend */}
          <div className="amu-workflow">
            <div className="amu-workflow-title">Workflow</div>
            {WORKFLOW.map((s, i) => (
              <div key={s} className="amu-workflow-row">
                <div className="amu-workflow-dot" style={{ background: WORKFLOW_DOTS[s] }} />
                <span className="amu-workflow-label" style={{ color: WORKFLOW_DOTS[s] }}>{s}</span>
                {i < WORKFLOW.length - 1 && <span className="amu-workflow-arrow">↓</span>}
              </div>
            ))}
          </div>

          {/* User */}
          <div className="amu-user">
            <div className="amu-avatar">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="amu-username">{user?.username || 'User'}</div>
              <div className={`amu-role amu-role-${user?.role || 'customer'}`}>
                {user?.role || 'customer'}
              </div>
            </div>
            <button className="amu-logout-btn" onClick={handleLogout} title="Logout">⏻</button>
          </div>

        </aside>

        {/* ── Main ── */}
        <div className="amu-main">

          {/* Topbar */}
          <div className="amu-topbar">
            <span className="amu-topbar-title">Order Processing System</span>
            <div className="amu-topbar-actions">
              <NotificationBell />
              <button className="amu-new-order-btn" onClick={() => navigate('/orders/create')}>
                <span style={{ fontSize: 16 }}>+</span> New Order
              </button>
            </div>
          </div>

          {/* Page content */}
          <div className="amu-content">
            <Outlet />
          </div>

        </div>
      </div>
    </>
  )
}