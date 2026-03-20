import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders, fetchSummary, updateStatus } from '@/api/ordersApi'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'

const WORKFLOW = ['pending', 'processing', 'shipped', 'completed']

const STATUS_META = {
  pending:    { color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
  processing: { color: '#6C47FF', bg: '#EDEAFF', dot: '#6C47FF' },
  shipped:    { color: '#9B6DFF', bg: '#F3EEFF', dot: '#9B6DFF' },
  completed:  { color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
}

const NEXT = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Dashboard data
  const [summary, setSummary] = useState(null)
  const [allOrders, setAllOrders] = useState([])

  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchSummary(),
      fetchOrders({ limit: 1000 }) // Fetch all orders
    ])
      .then(([summaryRes, ordersRes]) => {
        setSummary(summaryRes.data)
        setAllOrders(ordersRes.data.orders || [])
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Filter orders by status
  const displayedOrders = statusFilter 
    ? allOrders.filter(o => o.status === statusFilter)
    : allOrders

  // Handle status advance
  const handleAdvance = async (orderId, currentStatus) => {
    const nextStatus = NEXT[currentStatus]
    if (!nextStatus) return

    setUpdatingId(orderId)
    try {
      await updateStatus(orderId, nextStatus, `Manually advanced to ${nextStatus}`)
      load()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update status'
      setError(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>

  return (
    <div>
      <style>{`
        .owner-dashboard { display: flex; flex-direction: column; gap: 5px; }
        .dashboard-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 8px; }
        .dashboard-title { flex: 1; }
        .dashboard-title h1 { font-size: 28px; font-weight: 800; color: #2D1F6E; margin-bottom: 4px; }
        .dashboard-title p { font-size: 13px; color: #9B8FC0; font-weight: 500; }
        .dashboard-subtitle { font-size: 11px; font-weight: 700; color: #C4B8E8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
        .refresh-btn { background: #F3EEFF; border: 1.5px solid #E0D8FF; border-radius: 12px; padding: 9px 16px; color: #9B6DFF; font-weight: 700; font-size: 13px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .refresh-btn:hover { background: #EDE9FE; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
        .stat-card { background: #fff; border: 1.5px solid #F0EBFF; border-radius: 18px; padding: 22px 20px; box-shadow: 0 2px 14px rgba(155,109,255,0.07); position: relative; overflow: hidden; }
        .stat-card-icon { position: absolute; top: 0; right: 0; width: 68px; height: 68px; border-radius: 0 18px 0 68px; display: flex; align-items: flex-start; justify-content: flex-end; padding: 10px 10px 0 0; font-size: 24px; }
        .stat-label { font-size: 10px; font-weight: 700; color: #C4B8E8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
        .stat-value { font-size: 32px; font-weight: 800; color: #2D1F6E; letter-spacing: -0.02em; line-height: 1; }
        .stat-value-currency { font-size: 18px; font-weight: 600; color: #7C3AED; margin-top: 4px; }
        .revenue-display { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
        .revenue-currency { font-size: 32px; font-weight: 800; color: #2D1F6E; letter-spacing: -0.02em; line-height: 1; }
        .revenue-amount { font-size: 28px; font-weight: 800; color: #10B981; letter-spacing: -0.02em; line-height: 1; }

        .filters-container { background: #fff; border: 1.5px solid #F0EBFF; border-radius: 18px; padding: 16px 22px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; box-shadow: 0 2px 12px rgba(155,109,255,0.06); }
        .filter-label { font-size: 11px; font-weight: 700; color: #C4B8E8; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
        .filter-btn { padding: 6px 13px; border-radius: 20px; border: none; background: #F7F4FF; color: #9B8FC0; font-weight: 700; font-size: 11px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
        .filter-btn.active { background: linear-gradient(135deg, #9B6DFF, #7C3AED); color: #fff; }
        .filter-btn:hover { background: #EDE9FE; color: #7C3AED; }
        .filter-btn.active:hover { background: linear-gradient(135deg, #9B6DFF, #7C3AED); }

        .table-wrap { background: #fff; border: 1.5px solid #F0EBFF; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(155,109,255,0.07); }
        .table-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 14px; border-bottom: 1.5px solid #F7F4FF; flex-wrap: wrap; gap: 10px; background: #fff; }
        .table-title { font-size: 16px; font-weight: 800; color: #2D1F6E; }
        .table-title-sub { margin-left: 8px; font-size: 13px; color: #9B6DFF; font-weight: 600; }

        table { width: 100%; border-collapse: collapse; }
        thead { background: #FAF8FF; border-bottom: 1.5px solid #F0EBFF; }
        th { padding: 10px 22px; text-align: left; font-size: 10px; font-weight: 700; color: #C4B8E8; letter-spacing: 0.1em; text-transform: uppercase; }
        tbody tr { border-bottom: 1.5px solid #FAF8FF; transition: background 0.15s; }
        tbody tr:hover { background: #FAF8FF; }
        tbody tr:last-child { border-bottom: none; }
        td { padding: 13px 22px; font-size: 13px; color: #2D1F6E; vertical-align: middle; }
        td.customer-col { font-weight: 700; }
        td.customer-email { font-size: 11px; color: #C4B8E8; }
        td.total { font-weight: 700; color: #2D1F6E; }
        .order-number { font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700; color: #9B6DFF; }

        .advance-btn { background: #F3EEFF; border: 1.5px solid #E0D8FF; border-radius: 8px; padding: 5px 12px; color: #9B6DFF; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; transition: all 0.15s; }
        .advance-btn:hover:not(:disabled) { background: #EDE9FE; color: #7C3AED; }
        .advance-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .table-footer { padding: 12px 22px; border-top: 1.5px solid #F0EBFF; display: flex; justify-content: space-between; align-items: center; background: #FAF8FF; font-size: 12px; color: #C4B8E8; font-weight: 600; }
        .view-all-btn { background: none; border: 1.5px solid #E0D8FF; border-radius: 20px; padding: 5px 15px; color: #9B6DFF; font-weight: 700; font-size: 12px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .view-all-btn:hover { background: #F3EEFF; }

        .empty { text-align: center; padding: 60px 22px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty h3 { font-size: 16px; color: #2D1F6E; margin-bottom: 8px; }
        .empty p { font-size: 13px; color: #C4B8E8; }

        .alert { padding: 12px 18px; border-radius: 14px; margin-bottom: 20px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .alert-error { background: #FFF0F0; border: 1.5px solid #FFD0CC; color: #CC2200; }
      `}</style>

      <div className="owner-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            <div className="dashboard-subtitle">Business Dashboard</div>
            <h1>Welcome back! 👋</h1>
            <p>Manage all orders and track business metrics</p>
          </div>
          <button className="refresh-btn" onClick={load}>↻ Refresh</button>
        </div>

        {/* Error Alert */}
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Stats Section */}
        {summary && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#FFFBEB' }}>📦</div>
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{summary.total_orders}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#ECFDF5' }}>💰</div>
              <div className="stat-label">Total Revenue</div>
              <div className="revenue-display">
                <span className="revenue-currency">$</span>
                <span className="revenue-amount">{parseFloat(summary.total_revenue).toFixed(2)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#EDEAFF' }}>📈</div>
              <div className="stat-label">Completed Orders</div>
              <div className="stat-value">{summary.by_status.completed}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#F3EEFF' }}>⏳</div>
              <div className="stat-label">Orders In Progress</div>
              <div className="stat-value">
                {(summary.by_status.pending || 0) + (summary.by_status.processing || 0) + (summary.by_status.shipped || 0)}
              </div>
            </div>
          </div>
        )}
        

        
        {/* Order Pipeline */}
        <div style={{
            background: '#fff', borderRadius: 18, border: '1.5px solid #F0EBFF',
            padding: '16px 22px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 0,
            boxShadow: '0 2px 12px rgba(155,109,255,0.06)',
            animation: 'dashFadeUp 0.5s ease both', animationDelay: '320ms',
            overflowX: 'auto',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 18, whiteSpace: 'nowrap' }}>
            Order Pipeline
          </span>
          {WORKFLOW.map((s, i) => {
            const m = STATUS_META[s]
            const count = allOrders.filter(o => o.status === s).length
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div onClick={() => setStatusFilter(s)} style={{
                  background: statusFilter === s ? m.dot : m.bg,
                  borderRadius: 12, padding: '8px 18px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: statusFilter === s ? '#fff' : m.color, lineHeight: 1 }}>{count}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusFilter === s ? '#fff' : m.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <div style={{ width: 20, height: 2, background: '#EDE9FE' }} />
                    <span style={{ color: '#C4B8E8', fontSize: 14 }}>›</span>
                  </div>
                )}
              </div>
            )
          })}
          {statusFilter && (
            <button onClick={() => setStatusFilter('')} style={{
              marginLeft: 'auto', background: 'none', border: '1.5px solid #E0D8FF',
              borderRadius: 20, padding: '5px 13px', color: '#9B6DFF',
              fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>Clear ×</button>
          )}
        </div>

        {/* Orders Table */}
        <div className="table-wrap">
          <div className="table-header">
            <div>
              <span className="table-title">All Customer Orders</span>
              {statusFilter && <span className="table-title-sub">— {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['', 'pending', 'processing', 'shipped', 'completed'].map(f => (
                <button key={f || 'all'} onClick={() => setStatusFilter(f)} style={{
                  padding: '5px 13px', borderRadius: 20, border: 'none',
                  background: statusFilter === f ? 'linear-gradient(135deg,#9B6DFF,#7C3AED)' : '#F7F4FF',
                  color: statusFilter === f ? '#fff' : '#9B8FC0',
                  fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.15s',
                }}>{f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}</button>
              ))}
            </div>
          </div>

          {displayedOrders.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <h3>No orders found</h3>
              <p>Try adjusting your filters or create a new order</p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map(order => {
                    const nextStatus = NEXT[order.status]
                    return (
                      <tr key={order.id}>
                        <td><span className="order-number">{order.order_number}</span></td>
                        <td className="customer-col">{order.customer_name}</td>
                        <td className="customer-email">{order.customer_email || '—'}</td>
                        <td>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</td>
                        <td className="total">${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td style={{ fontSize: 12, color: '#aaa' }}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {nextStatus ? (
                            <button
                              className="advance-btn"
                              onClick={() => handleAdvance(order.id, order.status)}
                              disabled={updatingId === order.id}
                              title={`Advance to ${nextStatus}`}
                            >
                              {updatingId === order.id ? '...' : `→ ${nextStatus}`}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#aaa' }}>Complete</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="table-footer">
                <span>Showing {displayedOrders.length} of {allOrders.length} orders</span>
                <button className="view-all-btn" onClick={() => navigate('/orders')}>
                  View Full Details →
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}