import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const roleInfo = {
  customer: {
    icon: '🛒',
    label: 'Customer',
    desc: 'Place orders and track your own orders',
    color: '#2563eb',
    bg: '#dbeafe',
  },
  owner: {
    icon: '🏪',
    label: 'Owner / Staff',
    desc: 'View all orders and advance order status',
    color: '#d97706',
    bg: '#fef3c7',
  },
  admin: {
    icon: '🔐',
    label: 'Admin',
    desc: 'Full access including delete and user management',
    color: '#059669',
    bg: '#d1fae5',
  },
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', role: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.role) { setError('Please select a role.'); return }
    setLoading(true)
    setError('')
    try {
      await register(form.username, form.password, form.role)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg = data ? Object.values(data).flat().join(', ') : 'Registration failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f0f2f5', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>⚙️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>Create Account</h1>
          <p style={{ color: '#7c7ca0', fontSize: 14, marginTop: 4 }}>
            Choose your role to get started
          </p>
        </div>

        <div className="card">
          <div className="card-header"><h3>Register</h3></div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Username</label>
                <input
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              {/* Role Selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a6a', display: 'block', marginBottom: 10 }}>
                  Select Role *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(roleInfo).map(([key, info]) => (
                    <div
                      key={key}
                      onClick={() => setForm({ ...form, role: key })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${form.role === key ? info.color : '#e8e8f0'}`,
                        background: form.role === key ? info.bg : '#fff',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{info.icon}</span>
                      <div>
                        <div style={{
                          fontWeight: 700, fontSize: 14,
                          color: form.role === key ? info.color : '#1a1a2e'
                        }}>
                          {info.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#7c7ca0', marginTop: 2 }}>
                          {info.desc}
                        </div>
                      </div>
                      {form.role === key && (
                        <span style={{ marginLeft: 'auto', color: info.color, fontWeight: 700 }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Creating account...' : '✓ Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#7c7ca0' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6c63ff', fontWeight: 600 }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}