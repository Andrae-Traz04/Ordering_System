import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders } from '@/api/ordersApi'
import StatusBadge from '@/components/StatusBadge'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    fetchOrders({ search, status: statusFilter })
      .then(r => setOrders(r.data.orders))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, statusFilter])

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <input
          placeholder="🔍 Search order #, name, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      <div className="card">
        {loading
          ? <div className="loading"><div className="spinner" /><span>Loading...</span></div>
          : orders.length === 0
            ? <div className="empty">
                <div className="empty-icon">📭</div>
                <h3>No orders found</h3>
                <p>Try adjusting filters or create a new order</p>
              </div>
            : <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th><th>Customer</th><th>Items</th>
                      <th>Total</th><th>Status</th><th>Date</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td><span className="font-mono">{o.order_number}</span></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{o.customer_email}</div>
                        </td>
                        <td>{o.item_count} item{o.item_count !== 1 ? 's' : ''}</td>
                        <td><strong>${parseFloat(o.total_amount).toFixed(2)}</strong></td>
                        <td><StatusBadge status={o.status} /></td>
                        <td style={{ fontSize: 12, color: '#aaa' }}>
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/orders/${o.id}`)}>
                            View →
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