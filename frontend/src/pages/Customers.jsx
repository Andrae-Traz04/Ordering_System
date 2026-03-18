import { useState, useEffect } from 'react'
import { fetchCustomers } from '@/api/ordersApi'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomers()
      .then(r => setCustomers(r.data.customers))
      .catch(() => setError('Failed to load customers.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        {customers.length === 0
          ? <div className="empty">
              <div className="empty-icon">👥</div>
              <h3>No customers yet</h3>
              <p>Customers are created automatically when orders are placed</p>
            </div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th>
                    <th>Phone</th><th>Orders</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: '#7c7ca0' }}>{c.email}</td>
                      <td style={{ color: '#7c7ca0' }}>{c.phone || '—'}</td>
                      <td>
                        <span style={{
                          background: '#ede9fe', color: '#7c3aed',
                          padding: '2px 8px', borderRadius: 12,
                          fontSize: 12, fontWeight: 600
                        }}>
                          {c.order_count}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#aaa' }}>
                        {new Date(c.created_at).toLocaleDateString()}
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