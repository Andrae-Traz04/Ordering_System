import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSummary, fetchOrders } from '@/api/ordersApi'
import StatusBadge from '@/components/StatusBadge'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchSummary(), fetchOrders()])
      .then(([s, o]) => {
        setSummary(s.data)
        setOrders(o.data.orders.slice(0, 5))
      })
      .catch(() => setError('Failed to load dashboard. Is Django running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <div className="stats-grid">
          {[
            { label: 'Total Orders', value: summary.total_orders, color: '#6c63ff' },
            { label: 'Pending',      value: summary.by_status.pending,    color: '#d97706' },
            { label: 'Processing',   value: summary.by_status.processing, color: '#2563eb' },
            { label: 'Shipped',      value: summary.by_status.shipped,    color: '#7c3aed' },
            { label: 'Completed',    value: summary.by_status.completed,  color: '#059669' },
            { label: 'Total Revenue',
              value: `$${parseFloat(summary.total_revenue).toFixed(2)}`,
              color: '#6c63ff',
              sub: `$${parseFloat(summary.completed_revenue).toFixed(2)} from completed` },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              {s.sub && <div className="stat-sub">{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Recent Orders</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
            View All →
          </button>
        </div>
        {orders.length === 0
          ? <div className="empty"><div className="empty-icon">📭</div><h3>No orders yet</h3></div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th><th>Customer</th>
                    <th>Total</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><span className="font-mono">{o.order_number}</span></td>
                      <td>{o.customer_name}</td>
                      <td><strong>${parseFloat(o.total_amount).toFixed(2)}</strong></td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>
                        <button className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/orders/${o.id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  )
}