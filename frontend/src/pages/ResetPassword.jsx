import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset } from '@/api/ordersApi';
import '../ResetPassword.css';

export default function ResetPassword() {
  const { userId, token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('form'); // 'form', 'success', 'error'
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await confirmPasswordReset(userId, token, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      setStatus('success');
      setMessage(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.error || 
        'Failed to reset password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    calculatePasswordStrength(password);
  };

  const getStrengthLabel = () => {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[passwordStrength];
  };

  const getStrengthColor = () => {
    const colors = ['', '#dc3545', '#ffc107', '#ffc107', '#28a745', '#28a745'];
    return colors[passwordStrength];
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {status === 'form' ? (
          <div className="reset-form">
            <h2>🔐 Reset Your Password</h2>
            <p className="subtitle">Enter a new password for your account</p>

            <form onSubmit={handleResetPassword}>
              {/* New Password Field */}
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  disabled={loading}
                  className={errors.newPassword ? 'input-error' : ''}
                  autoComplete="new-password"
                />
                {errors.newPassword && (
                  <span className="error-message">{errors.newPassword}</span>
                )}
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getStrengthColor(),
                        }}
                      ></div>
                    </div>
                    <span 
                      className="strength-label"
                      style={{ color: getStrengthColor() }}
                    >
                      {getStrengthLabel()}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>

              {/* Password Requirements */}
              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li className={newPassword.length >= 6 ? 'met' : ''}>
                    ✓ At least 6 characters
                  </li>
                  <li className={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'met' : ''}>
                    ✓ Mix of uppercase and lowercase letters
                  </li>
                  <li className={/\d/.test(newPassword) ? 'met' : ''}>
                    ✓ At least one number
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn-reset"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? '⏳ Resetting...' : '✓ Reset Password'}
              </button>
            </form>

            <p className="back-link">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Back to Login
              </button>
            </p>
          </div>
        ) : status === 'success' ? (
          <div className="reset-success">
            <div className="success-icon">✓</div>
            <h2>Password Reset Successfully!</h2>
            <p>{message}</p>
            <p className="redirect-text">Redirecting to login in 3 seconds...</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary"
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          <div className="reset-error">
            <div className="error-icon">✗</div>
            <h2>Reset Failed</h2>
            <p>{message}</p>
            <div className="action-buttons">
              <button
                onClick={() => {
                  setStatus('form');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary"
              >
                Try Again
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
    </div>
  );
}
