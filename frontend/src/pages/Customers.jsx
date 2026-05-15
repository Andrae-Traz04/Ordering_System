import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchCustomers } from '@/api/ordersApi'

const C = {
  primary: '#7C3AED',
  primary2: '#9B6DFF',
  dark: '#2D1F6E',
  mid: '#9B8FC0',
  light: '#C4B8E8',
  white: '#fff',
  border: '#F0EBFF',
  pageBg: '#FAF8FF',
  success: '#10B981',
  successBg: '#ECFDF5',
  warn: '#F59E0B',
  warnBg: '#FFFBEB',
  red: '#ef4444',
  redBg: '#fef2f2',
}

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchCustomers()
      .then(r => setCustomers(r.data.customers))
      .catch(() => setError('Failed to load customers.'))
      .finally(() => setLoading(false))
  }, [user])

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
                      <td style={{ fontWeight: 600, color: C.dark }}>{c.name}</td>
                      <td style={{ color: C.mid }}>{c.email}</td>
                      <td style={{ color: C.mid }}>{c.phone || '—'}</td>
                      <td>
                        <span style={{
                          background: C.softBg, color: C.primary,
                          padding: '2px 8px', borderRadius: 12,
                          fontSize: 12, fontWeight: 600
                        }}>
                          {c.order_count}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: C.mid }}>
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