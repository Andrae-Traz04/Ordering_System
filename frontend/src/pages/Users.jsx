import { useState, useEffect } from 'react'
import { fetchUsers } from '@/api/ordersApi'

const roleColor = {
  customer: { bg: '#dbeafe', color: '#2563eb' },
  owner:    { bg: '#fef3c7', color: '#d97706' },
  admin:    { bg: '#d1fae5', color: '#059669' },
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
                      <td style={{ color: '#aaa', fontSize: 12 }}>#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.username}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: roleColor[u.role]?.bg || '#f0f0f0',
                          color: roleColor[u.role]?.color || '#555',
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