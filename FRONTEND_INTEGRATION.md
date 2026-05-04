# Frontend Integration Guide

## Add Routes to Your React App

Update your frontend routing to include the new email activation and password reset pages.

### 1. Update `frontend/src/App.jsx`

Add imports and routes for the new pages:

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Activate from './pages/Activate';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import Register from './pages/Register';
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Email Activation Routes */}
        <Route path="/activate/:userId/:token" element={<Activate />} />
        
        {/* Password Reset Routes */}
        <Route path="/reset-password/:userId/:token" element={<ResetPassword />} />
        
        {/* Other Routes */}
        {/* ... */}
      </Routes>
    </Router>
  );
}

export default App;
```

### 2. Update `frontend/src/pages/Register.jsx`

Add a message and link to direct users to check their email after registration:

```jsx
// In your Register component, after successful registration:

const handleRegister = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(
      'http://localhost:8000/api/v1/auth/register/',
      {
        username: formData.username,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: 'customer',
      }
    );

    // Show success message
    alert('✓ Registration successful!\nPlease check your email to activate your account.');
    navigate('/login');
  } catch (error) {
    setError(error.response?.data?.message || 'Registration failed');
  }
};
```

### 3. Update `frontend/src/pages/Login.jsx`

Add a "Forgot Password?" link:

```jsx
// In your Login component, add this link:

<div className="login-footer">
  <p>
    Don't have an account? <Link to="/register">Register here</Link>
  </p>
  <p>
    Forgot your password? <Link to="/forgot-password">Reset it here</Link>
  </p>
</div>
```

### 4. Create `frontend/src/pages/ForgotPassword.jsx`

For users to request password reset:

```jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'success' or 'error'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/auth/request-reset/',
        { email }
      );
      setStatus('success');
      setMessage(response.data.detail);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>🔐 Reset Your Password</h2>
      
      {status === 'success' ? (
        <>
          <p style={{ color: 'green' }}>✓ {message}</p>
          <p>Check your email for the password reset link.</p>
          <button onClick={() => navigate('/login')}>Back to Login</button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{ padding: '10px', marginBottom: '10px' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px' }}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
          {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
        </form>
      )}
    </div>
  );
}
```

### 5. Update `frontend/src/pages/Login.jsx` - Add Forgot Password Route

```jsx
// Add this route in your Login component or App.jsx
<Route path="/forgot-password" element={<ForgotPassword />} />
```

---

## Email Flow Diagram

```
User Registration
       ↓
User creates account
       ↓
Backend creates INACTIVE user
       ↓
Activation email sent to user's Gmail
       ↓
User clicks link in email
       ↓
Frontend: /activate/:userId/:token
       ↓
Backend: Verify token & activate user
       ↓
Frontend: Show success → Redirect to login
       ↓
User logs in
```

---

## Password Reset Flow

```
User clicks "Forgot Password"
       ↓
User enters email: /forgot-password
       ↓
Backend: Send password reset email
       ↓
User clicks link in email
       ↓
Frontend: /reset-password/:userId/:token
       ↓
User enters new password
       ↓
Backend: Verify token & update password
       ↓
Frontend: Show success → Redirect to login
       ↓
User logs in with new password
```

---

## Testing the Flow

### Test Registration + Activation

1. **Register with fake account**
   ```
   URL: http://localhost:5173/register
   
   Email: test@gmail.com
   Username: testuser
   Password: Test123!
   ```

2. **Check Django console** (if using console email backend)
   - See the activation email printed
   - Copy the activation URL

3. **Visit activation URL**
   - Should show success message
   - User is now active

4. **Login**
   - Should work with activated account

### Test Password Reset

1. **Request reset**
   ```
   URL: http://localhost:5173/forgot-password
   Email: test@gmail.com
   ```

2. **Check email** (Gmail)
   - Find reset email
   - Click reset link

3. **Set new password**
   - Enter new password
   - Confirm password

4. **Login with new password**
   - Should work

---

## Customization

### Change Email Backend

For **Gmail SMTP** (production):
```python
# config/settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
```

For **Console Backend** (development/testing):
```python
# config/settings.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

For **File Backend** (development, saves to file):
```python
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = BASE_DIR / 'sent_emails'
```

### Customize Email Templates

Edit templates in:
```
orders/templates/emails/
  ├── activation_email.html
  ├── password_reset_email.html
  └── order_notification.html
```

### Change Activation Link Expiration

Update in `config/settings.py`:
```python
ACTIVATION_TOKEN_EXPIRE_HOURS = 24  # Change to your desired hours
```

---

## Security Checklist

- [ ] Use Gmail app password (not regular password)
- [ ] Never commit credentials to Git
- [ ] Use environment variables in production
- [ ] Test with console backend first
- [ ] Verify email templates render correctly
- [ ] Test token expiration
- [ ] Verify only activated users can log in
- [ ] Test password reset security

---

## Common Issues

**Issue**: Emails not being sent
- Check `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` in settings
- Verify app password is 16 characters
- Check Django console for error messages

**Issue**: Activation link doesn't work
- Verify link format: `/activate/{user_id}/{token}/`
- Check token hasn't expired (24 hours)
- Verify user exists in database

**Issue**: Password reset token invalid
- Link must be used within 24 hours
- Token is based on user's password (changes when password is reset)
- User's email must match in system

---

## Support

Refer to:
- `EMAIL_SETUP_GUIDE.md` for email configuration
- Django email documentation
- React Router documentation
