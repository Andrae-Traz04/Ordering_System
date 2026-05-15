import { useState, useEffect } from 'react'
import { fetchUsers } from '@/api/ordersApi'

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

const roleColor = {
  customer: { bg: '#EFF6FF', color: '#3B82F6' },
  owner:    { bg: '#FFF7ED', color: '#EA580C' },
  admin:    { bg: '#ECFDF5', color: '#10B981' },
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
      .then(r => setUsers(r.data.users))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        {users.length === 0
          ? <div className="empty">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
            </div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: C.mid, fontSize: 12 }}>#{u.id}</td>
                      <td style={{ fontWeight: 600, color: C.dark }}>{u.username}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: roleColor[u.role]?.bg || C.border,
                          color: roleColor[u.role]?.color || C.mid,
                          textTransform: 'uppercase',
                        }}>
                          {u.role || 'No role'}
                        </span>
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