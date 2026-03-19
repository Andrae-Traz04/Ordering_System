import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const roleInfo = {
  customer: { label: 'Customer', desc: 'Shop & Order' },
  owner: { label: 'Owner', desc: 'Manage Store' },
  admin: { label: 'Admin', desc: 'Full Access' },
}

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', role: 'customer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.role) { setError('Please select a role.'); return }
    setLoading(true)
    setError('')
    try {
      await registerUser(form.username, form.password, form.role)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      const data = err.response?.data
      // If the error is an object (common in DRF), flatten it
      const msg = data && typeof data === 'object' 
        ? Object.values(data).flat().join(', ') 
        : 'Registration failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-visual-refresh">
      {/* Left: Form Section */}
      <div className="visual-form">
        <div className="brand-logo">
          <span className="logo-sparkle">✨</span> AMU Bowls
        </div>
        
        <div className="text-header">
          <h2>Create Account</h2>
          <p>Join us and start your delicious journey today.</p>
        </div>

        {error && <div className="error-pill">{error}</div>}

        <form onSubmit={submit}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              className="capsule-input"
              placeholder="Pick a username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              className="capsule-input"
              placeholder="Create a password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>I am a...</label>
            <div className="role-selector">
              {Object.entries(roleInfo).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  className={`role-btn ${form.role === key ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: key })}
                >
                  <span className="role-label">{info.label}</span>
                </button>
              ))}
            </div>
            <p className="role-desc">
              {roleInfo[form.role]?.desc}
            </p>
          </div>

          <button type="submit" className="capsule-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="footer-link">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>

      {/* Right: Image Section */}
      <div className="image-section">
        <img 
          src="/gift-box-reg.jpeg" 
          alt="Pink Gift Box" 
          className="cover-image"
        />
        <div className="image-overlay">
          <h3>Unbox Happiness</h3>
          <p>Experience the joy of perfect ordering.</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

        .register-visual-refresh {
          display: flex;
          height: 100vh;
          width: 100vw;
          font-family: 'Poppins', sans-serif;
          background: #fff;
          overflow: hidden;
        }

        /* --- Left Side: Form --- */
        .visual-form {
          flex: 1;
          padding: 60px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 600px;
          margin: 0 auto; /* Center if screen is wide */
          animation: slideInLeft 0.6s ease-out;
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
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
        .logo-sparkle { color: #E4405F; }

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

        .error-pill {
          background: #fee2e2;
          color: #ef4444;
          padding: 10px 15px;
          border-radius: 20px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 500;
        }

        /* Inputs */
        .input-group {
          margin-bottom: 20px;
        }
        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
          margin-left: 10px; /* Slight indent to match capsule curve */
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
        .capsule-input:focus {
          border-color: #E4405F;
          background: #fff;
          box-shadow: 0 4px 12px rgba(228, 64, 95, 0.1);
        }

        /* Role Selector */
        .role-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        .role-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid #eee;
          background: #fff;
          border-radius: 30px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          transition: all 0.3s;
        }
        .role-btn:hover {
          background: #f5f5f5;
        }
        .role-btn.active {
          border-color: #E4405F;
          background: #E4405F;
          color: white;
          box-shadow: 0 4px 12px rgba(228, 64, 95, 0.2);
        }
        .role-desc {
          font-size: 12px;
          color: #888;
          margin-left: 12px;
          font-style: italic;
        }

        /* Submit Button */
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
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .capsule-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          background: #000;
        }
        .capsule-btn:disabled {
          background: #ccc;
          transform: none;
          cursor: not-allowed;
        }

        .footer-link {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #666;
        }
        .footer-link a {
          color: #E4405F;
          text-decoration: none;
          font-weight: 600;
          margin-left: 5px;
        }
        .footer-link a:hover {
          text-decoration: underline;
        }

        /* --- Right Side: Image --- */
        .image-section {
          flex: 1;
          position: relative;
          background: #f0f0f0;
          overflow: hidden;
          display: none; /* Hidden on mobile by default logic, but we use flex */
        }
        
        @media (min-width: 900px) {
          .image-section { display: block; }
        }

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 10s ease;
        }
        .image-section:hover .cover-image {
          transform: scale(1.05); /* Subtle zoom effect */
        }

        .image-overlay {
          position: absolute;
          bottom: 60px;
          left: 60px;
          right: 60px;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
          background: rgba(255, 255, 255, 0.1); /* Glassmorphism hint */
          backdrop-filter: blur(10px);
          padding: 30px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .image-overlay h3 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .image-overlay p {
          font-size: 16px;
          opacity: 0.9;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .visual-form { padding: 40px 30px; }
        }
      `}</style>
    </div>
  )
}
