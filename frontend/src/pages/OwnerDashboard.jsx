import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders, fetchSummary, updateStatus } from '@/api/ordersApi'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'
import {
  IconStatOrders,
  IconStatRevenue,
  IconStatCompleted,
  IconStatProgress,
} from '@/components/IconLibrary'

// ── Constants ────────────────────────────────────────────────────

const WORKFLOW = ['pending', 'processing', 'shipped', 'completed']

const greeting = (() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
})()

const STATUS_META = {
  pending:    { color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
  processing: { color: '#6C47FF', bg: '#EDEAFF', dot: '#6C47FF' },
  shipped:    { color: '#9B6DFF', bg: '#F3EEFF', dot: '#9B6DFF' },
  completed:  { color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
}

const NEXT = {
  pending:    'processing',
  processing: 'shipped',
  shipped:    'completed',
  completed:  null,
}

// ── Main Dashboard ───────────────────────────────────────────────

export default function OwnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary]     = useState(null)
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchSummary(), fetchOrders({ limit: 1000 })])
      .then(([summaryRes, ordersRes]) => {
        setSummary(summaryRes.data)
        setAllOrders(ordersRes.data.orders || [])
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const displayedOrders = statusFilter
    ? allOrders.filter(o => o.status === statusFilter)
    : allOrders

  const handleAdvance = async (orderId, currentStatus) => {
    const nextStatus = NEXT[currentStatus]
    if (!nextStatus) return
    setUpdatingId(orderId)
    try {
      await updateStatus(orderId, nextStatus, `Manually advanced to ${nextStatus}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  )

  return (
    <div className="owner-dashboard">

       {/* Header */}
       <div className="dashboard-header">
         <div className="dashboard-title">
           <div className="dashboard-subtitle">Business Dashboard</div>
           <h1>{greeting}, {user?.username}! 👋</h1>
           <p>Manage all orders and track business metrics</p>
         </div>
         <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
<button className="refresh-btn" onClick={load}>↻ Refresh</button>
            <button className="refresh-btn" onClick={() => navigate('/products')} style={{ background: 'linear-gradient(135deg, #6C47FF, #9B6DFF)', color: '#fff', border: 'none', fontWeight: 700 }}>
              Manage Products
            </button>
         </div>
       </div>

      {/* Error */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Stats */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#FFFBEB' }}>
              <IconStatOrders color="#F59E0B" size={48} strokeWidth={2} />
            </div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{summary.total_orders}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#ECFDF5' }}>
              <IconStatRevenue color="#10B981" size={48} strokeWidth={2} />
            </div>
            <div className="stat-label">Total Revenue</div>
            <div className="revenue-display">
              <span className="revenue-currency">₱</span>
              <span className="revenue-amount">{parseFloat(summary.total_revenue).toFixed(2)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#EDEAFF' }}>
              <IconStatCompleted color="#10B981" size={48} strokeWidth={2} />
            </div>
            <div className="stat-label">Completed Orders</div>
            <div className="stat-value">{summary.by_status.completed}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#F3EEFF' }}>
              <IconStatProgress color="#9B6DFF" size={48} strokeWidth={2} />
            </div>
            <div className="stat-label">Orders In Progress</div>
            <div className="stat-value">
              {(summary.by_status.pending || 0) + (summary.by_status.processing || 0) + (summary.by_status.shipped || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Order Pipeline */}
      <div className="order-pipeline-container">
        <span className="pipeline-label">Order Pipeline</span>
        {WORKFLOW.map((s, i) => {
          const m = STATUS_META[s]
          const count = allOrders.filter(o => o.status === s).length
          return (
            <div key={s} className="pipeline-stage">
              <div
                className="pipeline-badge"
                onClick={() => setStatusFilter(s)}
                style={{ background: statusFilter === s ? m.dot : m.bg }}
              >
                <span className="pipeline-count" style={{ color: statusFilter === s ? '#fff' : m.color }}>
                  {count}
                </span>
                <span className="pipeline-label-text" style={{ color: statusFilter === s ? '#fff' : m.color }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div className="pipeline-divider">
                  <div className="pipeline-line" />
                  <span className="pipeline-arrow">›</span>
                </div>
              )}
            </div>
          )
        })}
        {statusFilter && (
          <button className="pipeline-clear-btn" onClick={() => setStatusFilter('')}>Clear ×</button>
        )}
      </div>

      {/* Orders Table */}
      <div className="table-wrap">
        <div className="table-header">
          <div>
            <span className="table-title">Recent Customer Orders</span>
            {statusFilter && (
              <span className="table-title-sub">— {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['', 'pending', 'processing', 'shipped', 'completed'].map(f => (
              <button
                key={f || 'all'}
                onClick={() => setStatusFilter(f)}
                className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
              >
                {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
              </button>
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
                      <td className="total">₱{parseFloat(order.total_amount).toFixed(2)}</td>
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
  )
}