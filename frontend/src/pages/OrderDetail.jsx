import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrder, updateStatus, deleteOrder } from '@/api/ordersApi'
import StatusBadge from '@/components/StatusBadge'
import Stepper from '@/components/Stepper'

const NEXT = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
}

const NEXT_LABEL = {
  processing: 'Start Processing',
  shipped: 'Mark as Shipped',
  completed: 'Mark as Completed',
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = () => {
    fetchOrder(id)
      .then(r => setOrder(r.data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const advance = async () => {
    const next = NEXT[order.status]
    if (!next) return
    setUpdating(true)
    setError('')
    try {
      const r = await updateStatus(id, next, `Advanced to ${next}`)
      setOrder(r.data)
      setSuccess(`Status updated to ${next}!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.non_field_errors || data?.status || data?.detail || 'Failed to update status.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteOrder(id)
      navigate('/orders')
    } catch {
      setError('Failed to delete order.')
      setDeleting(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>
  if (!order)  return <div className="alert alert-error">{error}</div>

  const nextStatus = NEXT[order.status]

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="font-mono" style={{ fontSize: 18 }}>{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
            Created {new Date(order.created_at).toLocaleString()}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
          ← Back
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      {/* Stepper */}
      <div className="card">
        <div className="card-header"><h3>Order Workflow</h3></div>
        <div className="card-body">
          <Stepper currentStatus={order.status} />
          {nextStatus
            ? <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-success" onClick={advance} disabled={updating}>
                  {updating ? 'Updating...' : `→ ${NEXT_LABEL[nextStatus]}`}
                </button>
              </div>
            : <div className="alert alert-success">✓ This order has been completed</div>
          }
        </div>
      </div>

      {/* Customer */}
      <div className="card">
        <div className="card-header"><h3>Customer Details</h3></div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Name</span>
              <span className="detail-value">{order.customer_name}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Email</span>
              <span className="detail-value">{order.customer_email}</span>
            </div>
            {order.customer_phone && (
              <div className="detail-field">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{order.customer_phone}</span>
              </div>
            )}
            {order.notes && (
              <div className="detail-field">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="card-header"><h3>Order Items ({order.item_count})</h3></div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Product</th><th>Qty</th>
                <th>Unit Price</th><th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(it => (
                <tr key={it.id}>
                  <td>{it.product_name}</td>
                  <td>{it.quantity}</td>
                  <td>${parseFloat(it.unit_price).toFixed(2)}</td>
                  <td><strong>${parseFloat(it.subtotal).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-row">
            <span style={{ fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#6c63ff' }}>
              ${parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status History */}
      {order.status_history?.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Status History</h3></div>
          <div className="card-body">
            {order.status_history.map(h => (
              <div className="history-item" key={h.id}>
                <div className="history-dot" />
                <div>
                  <div className="history-text">
                    {h.from_status
                      ? <><strong>{h.from_status}</strong> → <strong>{h.to_status}</strong></>
                      : <>Order created as <strong>{h.to_status}</strong></>
                    }
                    {h.note && <span style={{ color: '#aaa' }}> — {h.note}</span>}
                  </div>
                  <div className="history-time">
                    {new Date(h.changed_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="card">
        <div className="card-body">
          {!confirmDelete
            ? <button className="btn btn-danger btn-sm"
                onClick={() => setConfirmDelete(true)}>
                🗑 Delete Order
              </button>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                  Are you sure? This cannot be undone.
                </span>
                <button className="btn btn-danger btn-sm"
                  onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
          }
        </div>
      </div>
    </div>
  )
}