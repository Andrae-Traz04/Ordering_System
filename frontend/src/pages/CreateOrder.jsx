import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '@/api/ordersApi'

const emptyItem = () => ({ product_name: '', quantity: 1, unit_price: '' })

export default function CreateOrder() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    customer_name: '', customer_email: '',
    customer_phone: '', notes: '',
  })
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateItem = (i, field, value) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const addItem = () => setItems([...items, emptyItem()])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const total = items.reduce(
    (s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0
  )

  const validate = () => {
    const e = {}
    if (!form.customer_name.trim()) e.customer_name = 'Required'
    if (!form.customer_email.trim()) e.customer_email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.customer_email)) e.customer_email = 'Invalid email'
    if (items.some(it => !it.product_name.trim())) e.items = 'All items need a product name'
    else if (items.some(it => parseFloat(it.unit_price) < 0 || it.unit_price === ''))
      e.items = 'All items need a valid price'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const res = await createOrder({ ...form, items })
      navigate(`/orders/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data
      const msg = data
        ? Object.values(data).flat().join(', ')
        : 'Failed to create order.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <form onSubmit={submit}>
        {/* Customer Info */}
        <div className="card">
          <div className="card-header"><h3>Customer Information</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Name *</label>
                <input value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Juan Dela Cruz" />
                {errors.customer_name && <span className="error-text">{errors.customer_name}</span>}
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.customer_email}
                  onChange={e => setForm({ ...form, customer_email: e.target.value })}
                  placeholder="juan@example.com" />
                {errors.customer_email && <span className="error-text">{errors.customer_email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.customer_phone}
                  onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="+63 912 345 6789" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special instructions..." />
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <div className="card-header">
            <h3>Order Items</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
              + Add Item
            </button>
          </div>
          <div className="card-body">
            {errors.items && <div className="alert alert-error">{errors.items}</div>}
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product Name</th>
                  <th style={{ width: '15%' }}>Qty</th>
                  <th style={{ width: '20%' }}>Unit Price</th>
                  <th style={{ width: '18%' }}>Subtotal</th>
                  <th style={{ width: '7%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      <input placeholder="Product name" value={it.product_name}
                        onChange={e => updateItem(i, 'product_name', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="1" value={it.quantity}
                        onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" placeholder="0.00"
                        value={it.unit_price}
                        onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0)).toFixed(2)}
                    </td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="total-row">
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#6c63ff' }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost"
            onClick={() => navigate('/orders')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : '✓ Create Order'}
          </button>
        </div>
      </form>
    </div>
  )
}