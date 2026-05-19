import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login: loginUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginUser(form.email, form.password)
      navigate('/profile')
    } catch (err) {
      console.error(err)
      const data = err.response?.data
      const msg = data?.detail || data?.error || 'Login failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Visual Panel - Hidden on Mobile */}
      <div className="login-visual-panel">
        <div className="visual-overlay">
          <div className="visual-content">
            <h1 className="brand-name">AMU Bowls</h1>
            <p className="brand-tagline">Experience seamless ordering</p>
            <div className="feature-list">
              <div className="feature-item">✓ Easy Order Management</div>
              <div className="feature-item">✓ Real-time Order Tracking</div>
              <div className="feature-item">✓ Secure Checkout</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="login-form-panel">
        <div className="form-wrapper">
          <div className="mobile-brand-header">
            <span className="brand-icon">🥣</span>
            <span className="brand-text">AMU Bowls</span>
          </div>

          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          <form onSubmit={submit} className="login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="input-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  inputMode="email"
                />
                <span className="field-icon">📧</span>
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <span className="field-icon">🔒</span>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="link-primary">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }

        .login-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          background: #f9fafb;
          overflow: hidden;
        }

        /* Desktop Visual Panel */
        .login-visual-panel {
          display: none;
          position: relative;
          width: 45%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .login-visual-panel {
            display: block;
          }
        }

        .login-visual-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23fff" opacity="0.05"/></svg>') repeat;
          background-size: 150px;
          opacity: 0.3;
        }

        .visual-overlay {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: white;
        }

        .visual-content {
          text-align: center;
          animation: fadeInUp 0.8s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand-name {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .brand-tagline {
          font-size: 1.125rem;
          opacity: 0.9;
          margin-bottom: 2rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: left;
        }

        .feature-item {
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          font-weight: 500;
        }

        /* Form Panel */
        .login-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-y: auto;
        }

        .form-wrapper {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile Brand Header */
        .mobile-brand-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        @media (min-width: 640px) {
          .mobile-brand-header {
            display: none;
          }
        }

        .brand-icon {
          font-size: 2rem;
        }

        .brand-text {
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Form Header */
        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .form-header p {
          color: #6b7280;
          font-size: 0.95rem;
        }

        /* Form Styles */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-field label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: #ffffff;
          font-size: 1rem;
          color: #1f2937;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-wrapper input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-wrapper input::placeholder {
          color: #9ca3af;
        }

        .field-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.125rem;
          opacity: 0.6;
        }

        /* Error Message */
        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .error-icon {
          font-size: 1rem;
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Spinner */
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Form Footer */
        .form-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .form-footer p {
          color: #6b7280;
          font-size: 0.95rem;
        }

        .link-primary {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .link-primary:hover {
          color: #4f46e5;
          text-decoration: underline;
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 640px) {
          .login-form-panel {
            padding: 1.5rem;
          }

          .form-header h2 {
            font-size: 1.5rem;
          }

          .form-wrapper {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .login-form-panel {
            padding: 1rem;
          }

          .mobile-brand-header {
            margin-bottom: 1.5rem;
          }
        }

        /* High Contrast Mode Support */
        @media (prefers-contrast: high) {
          .input-wrapper input {
            border-width: 3px;
          }
          
          .submit-btn {
            border: 2px solid white;
          }
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Touch Device Optimizations */
        @media (hover: none) and (pointer: coarse) {
          .submit-btn {
            padding: 1.25rem;
            font-size: 1.125rem;
          }

          .input-wrapper input {
            padding: 1rem 1rem 1rem 3rem;
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  )
}