import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Activate.css'; // Create this file with styles

export default function Activate() {
  const { userId, token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('activating'); // 'activating', 'success', 'error'
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (userId && token) {
      activateAccount();
    }
  }, [userId, token]);

  const activateAccount = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/auth/activate/${userId}/${token}/`
      );
      setStatus('success');
      setMessage(response.data.message || 'Account activated successfully!');
      setDetail(response.data.detail || 'You can now log in to your account.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.error || 
        'Activation failed. The link may have expired.'
      );
      setDetail('Please try registering again or request a new activation link.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      // Get email from params or user input
      const email = prompt('Enter your email address:');
      if (!email) {
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:8000/api/auth/resend-activation/',
        { email }
      );
      
      setStatus('success');
      setMessage('Activation email sent!');
      setDetail('Check your email for the activation link.');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to resend email');
      setDetail(error.response?.data?.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activate-container">
      <div className="activate-card">
        {loading && status === 'activating' ? (
          <div className="activate-loading">
            <div className="spinner"></div>
            <h2>🔄 Activating Your Account...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        ) : status === 'success' ? (
          <div className="activate-success">
            <div className="success-icon">✓</div>
            <h2>{message}</h2>
            <p>{detail}</p>
            <p className="redirect-text">Redirecting to login in 3 seconds...</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          <div className="activate-error">
            <div className="error-icon">✗</div>
            <h2>{message}</h2>
            <p>{detail}</p>
            
            <div className="action-buttons">
              <button 
                onClick={handleResendEmail}
                className="btn-secondary"
              >
                📧 Resend Activation Email
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Register Again
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-tertiary"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>Need Help?</h3>
        <ul>
          <li>Check your spam/junk folder for the activation email</li>
          <li>Ensure you're using the correct email address</li>
          <li>Activation links expire after 24 hours</li>
          <li>Contact support if you continue to experience issues</li>
        </ul>
      </div>
    </div>
  );
}
