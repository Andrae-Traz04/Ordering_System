import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrder, updateStatus, deleteOrder, submitReview, cancelOrder } from '@/api/ordersApi'
import { useAuth } from '@/context/AuthContext'
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

function StarRating({ value, onChange, readonly }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: 32,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hovered || value) ? '#f59e0b' : '#e8e8f0',
            transition: 'color 0.1s',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
      {!readonly && (
        <span style={{ fontSize: 13, color: '#7c7ca0', alignSelf: 'center', marginLeft: 8 }}>
          {value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Very Good' : 'Excellent'}
        </span>
      )}
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [order, setOrder]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [updating, setUpdating]     = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Review state
  const [reviewRating, setReviewRating]   = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError]     = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Cancel state
  const [cancelling, setCancelling]       = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

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
    setUpdating(true); setError('')
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

  const handleReview = async (e) => {
    e.preventDefault()
    setReviewLoading(true); setReviewError(''); setReviewSuccess('')
    try {
      await submitReview(id, { rating: reviewRating, comment: reviewComment })
      setReviewSuccess('Review submitted! Thank you. 🎉')
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data ? Object.values(data).flat().join(', ') : 'Failed to submit review.'
      setReviewError(msg)
    } finally {
      setReviewLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const r = await cancelOrder(id)
      setOrder(r.data)
      setSuccess('Order cancelled successfully.')
      setConfirmCancel(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || 'Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>
  if (!order)  return <div className="alert alert-error">{error || 'Order not found.'}</div>

  const nextStatus  = NEXT[order.status]
  const userRole       = user?.profile?.role || user?.role
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'
  const isAdmin        = userRole === 'admin'
  const isCustomer     = userRole === 'customer'
  const isMyOrder      = order.created_by_id === user?.id
  const canReview      = isCustomer && isMyOrder && order.status === 'completed' && !order.review
  const hasReview      = !!order.review

  return (
    <div style={{ maxWidth: 800 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="font-mono" style={{ fontSize: 18 }}>{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
            Created {new Date(order.created_at).toLocaleString()}
            {order.created_by_username && (
              <span> by <strong>{order.created_by_username}</strong></span>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
          ← Back
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      {/* Stepper + Workflow */}
      <div className="card">
        <div className="card-header"><h3>Order Workflow</h3></div>
        <div className="card-body">
          <Stepper currentStatus={order.status} />

          {/* Owner/Admin can advance status */}
          {isOwnerOrAdmin && nextStatus && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-success" onClick={advance} disabled={updating}>
                {updating ? 'Updating...' : `→ ${NEXT_LABEL[nextStatus]}`}
              </button>
            </div>
          )}

          {/* Customer sees status info only */}
          {isCustomer && nextStatus && order.status !== 'cancelled' && (
            <div className="alert alert-info" style={{ marginTop: 0 }}>
              ⏳ Your order is being processed. We will update you soon!
            </div>
          )}

          {!nextStatus && order.status !== 'cancelled' && (
            <div className="alert alert-success">✓ This order has been completed</div>
          )}

          {order.status === 'cancelled' && (
            <div className="alert alert-error">✕ This order has been cancelled</div>
          )}
        </div>
      </div>

      {/* Customer Details */}
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
              <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Notes</span>
                <span className="detail-value">{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card">
        <div className="card-header"><h3>Order Items ({order.item_count})</h3></div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
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
                    {h.changed_by_username && (
                      <span> by <strong>{h.changed_by_username}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review — Customer submits, Owner/Admin reads */}
      {(canReview || (hasReview && (isMyOrder || isOwnerOrAdmin))) && (
        <div className="card">
          <div className="card-header">
            <h3>⭐ {hasReview ? 'Customer Review' : 'Leave a Review'}</h3>
          </div>
          <div className="card-body">
            {hasReview ? (
              /* Show existing review */
              <div>
                <StarRating value={order.review.rating} readonly />
                <div style={{ marginTop: 12, fontSize: 14, color: '#1a1a2e', lineHeight: 1.6 }}>
                  {order.review.comment
                    ? `"${order.review.comment}"`
                    : <em style={{ color: '#aaa' }}>No comment left.</em>
                  }
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>
                  By <strong>{order.review.customer_username}</strong> on{' '}
                  {new Date(order.review.created_at).toLocaleDateString()}
                </div>
              </div>
            ) : canReview ? (
              /* Review form for customer */
              <form onSubmit={handleReview}>
                {reviewError   && <div className="alert alert-error">{reviewError}</div>}
                {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}

                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block', marginBottom: 10,
                    fontWeight: 600, fontSize: 13, color: '#4a4a6a',
                  }}>
                    Your Rating *
                  </label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Comment (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Share your experience with this order..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    style={{
                      padding: '9px 13px',
                      border: '1.5px solid #e8e8f0',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      width: '100%',
                      resize: 'vertical',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'}
                    onBlur={e => e.target.style.borderColor = '#e8e8f0'}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reviewLoading}
                >
                  {reviewLoading ? 'Submitting...' : '⭐ Submit Review'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      )}

      {/* Cancel — Customer only, pending orders */}
      {isCustomer && isMyOrder && order.status === 'pending' && (
        <div className="card">
          <div className="card-body">
            {!confirmCancel ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmCancel(true)}
              >
                ✕ Cancel Order
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                  Cancel this order? This cannot be undone.
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmCancel(false)}
                >
                  Keep Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete — Admin only */}
      {isAdmin && (
        <div className="card">
          <div className="card-body">
            {!confirmDelete
              ? (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  🗑 Delete Order
                </button>
              )
              : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                    Are you sure? This cannot be undone.
                  </span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  )
}