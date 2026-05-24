import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '@/api/ordersApi'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await requestPasswordReset(email)
      setSubmitted(true)
      setMessage(res.data?.message || 'If this email is registered, a password reset link has been sent.')
    } catch (err) {
      const data = err.response?.data
      setMessage(data?.error || data?.detail || 'Unable to send reset email right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-visual-refresh">
      <div className="visual-form">
        <div className="brand-logo">
          <span className="logo-sparkle">✨</span> AMU Bowls
        </div>

        <div className="text-header">
          <h2>Reset your password</h2>
          <p>Enter your email and we’ll send a reset link using the same backend flow as mobile.</p>
        </div>

        {message && <div className={submitted ? 'success-pill' : 'error-pill'}>{message}</div>}

        {!submitted && (
          <form onSubmit={submit}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                className="capsule-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <button type="submit" className="capsule-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="footer-link">
          Back to <Link to="/login">Log In</Link>
        </div>
      </div>

      <div className="image-section">
        <img src="/gift-box-reg.jpeg" alt="Reset password visual" className="cover-image" />
        <div className="image-overlay">
          <h3>Need help signing in?</h3>
          <p>We’ll email a secure reset link to the address on file.</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

        .register-visual-refresh {
          display: flex;
          height: 100vh;
          min-height: 100dvh;
          width: 100vw;
          font-family: 'Poppins', sans-serif;
          background: #fff;
          overflow-x: hidden;
        }

        .visual-form {
          flex: 1;
          padding: 60px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 600px;
          margin: 0 auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .brand-logo {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin-bottom: 40px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-sparkle { color: var(--accent); }

        .text-header h2 {
          font-size: 32px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 10px;
        }

        .text-header p {
          color: #666;
          font-size: 15px;
          margin-bottom: 30px;
        }

        .success-pill,
        .error-pill {
          padding: 10px 15px;
          border-radius: 20px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 500;
        }

        .success-pill {
          background: #dcfce7;
          color: #166534;
        }

        .error-pill {
          background: #fee2e2;
          color: #ef4444;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
          margin-left: 10px;
        }

        .capsule-input {
          width: 100%;
          padding: 14px 24px;
          border-radius: 50px;
          border: 2px solid #eee;
          background: #f9f9f9;
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .capsule-btn {
          width: 100%;
          padding: 16px;
          border-radius: 50px;
          border: none;
          background: #1a1a1a;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
        }

        .footer-link {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #666;
        }

        .footer-link a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
          margin-left: 5px;
        }

        .image-section {
          flex: 1;
          position: relative;
          background: #f0f0f0;
          overflow: hidden;
          display: none;
        }

        @media (min-width: 900px) {
          .image-section { display: block; }
        }

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          inset: auto 0 0 0;
          padding: 32px;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,0.65));
          color: white;
        }

        .image-overlay h3 {
          margin: 0 0 8px;
          font-size: 28px;
        }

        .image-overlay p {
          margin: 0;
          max-width: 340px;
          color: rgba(255,255,255,0.9);
        }
      `}</style>
    </div>
  )
}