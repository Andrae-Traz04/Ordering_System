import { Link, useLocation } from 'react-router-dom'

export default function ActivationPending() {
  const location = useLocation()
  const email = location.state?.email

  return (
    <div className="activation-shell">
      <div className="activation-card">
        <div className="activation-badge">Activation sent</div>
        <h1>Check your inbox</h1>
        <p>
          {email
            ? `We sent an activation link to ${email}.`
            : 'We sent you an activation link.'}
          {' '}
          Open the email, click the button, and then come back to log in.
        </p>
        <div className="activation-actions">
          <Link to="/login" className="activation-button primary">Go to login</Link>
          <Link to="/register" className="activation-button secondary">Create another account</Link>
        </div>
      </div>

      <style>{`
        .activation-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(236,72,153,0.18), transparent 32%),
            radial-gradient(circle at bottom right, rgba(124,58,237,0.16), transparent 28%),
            linear-gradient(180deg, #fff 0%, #f8fafc 100%);
        }

        .activation-card {
          width: min(560px, 100%);
          padding: 40px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12);
          text-align: center;
        }

        .activation-badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(124, 58, 237, 0.12);
          color: #6d28d9;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .activation-card h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3rem);
          color: #0f172a;
        }

        .activation-card p {
          color: #475569;
          line-height: 1.7;
          margin: 18px 0 0;
        }

        .activation-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .activation-button {
          padding: 14px 20px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 700;
        }

        .activation-button.primary {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: white;
        }

        .activation-button.secondary {
          background: #e2e8f0;
          color: #0f172a;
        }
      `}</style>
    </div>
  )
}