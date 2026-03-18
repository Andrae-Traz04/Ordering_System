import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as apiLogin } from '@/api/ordersApi'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await apiLogin(form)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f0f2f5'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>⚙️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>OrderFlow</h1>
          <p style={{ color: '#7c7ca0', marginTop: 4 }}>Sign in to your account</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Username</label>
                <input
                  placeholder="Enter username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}
                type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#7c7ca0' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#6c63ff', fontWeight: 600 }}>
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}