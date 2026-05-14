import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createOwnerApplication } from '@/api/ordersApi'

export default function ApplyForOwner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    business_name: '',
    business_description: '',
    business_address: '',
    phone_number: '',
    website: '',
    experience_years: '',
    motivation: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await createOwnerApplication({
        ...form,
        experience_years: parseInt(form.experience_years)
      })
      alert('Application submitted successfully! You will be notified once reviewed.')
      navigate('/profile')
    } catch (err) {
      console.error(err)
      const data = err.response?.data
      let msg = 'Application submission failed.'

      if (data) {
        if (typeof data === 'string') {
          msg = data
        } else if (typeof data === 'object') {
          msg = Object.values(data).flat().join(' ')
        }
      }

      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Redirect if not logged in or already owner/admin
  if (!user) {
    navigate('/login')
    return null
  }

  if (user.role === 'admin') {
    navigate('/profile')
    return null
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Apply for Owner Status</h1>
      <p>Fill out this form to apply for owner privileges in the ordering system.</p>

      {error && <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>{error}</div>}

      <form onSubmit={submit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Business Name *</label>
          <input
            type="text"
            value={form.business_name}
            onChange={e => setForm({ ...form, business_name: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Your business or store name"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Business Description *</label>
          <textarea
            value={form.business_description}
            onChange={e => setForm({ ...form, business_description: e.target.value })}
            required
            rows={4}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Describe your business, what you sell, etc."
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Business Address *</label>
          <textarea
            value={form.business_address}
            onChange={e => setForm({ ...form, business_address: e.target.value })}
            required
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Full business address"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number *</label>
          <input
            type="tel"
            value={form.phone_number}
            onChange={e => setForm({ ...form, phone_number: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="+1-555-123-4567"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Website (optional)</label>
          <input
            type="url"
            value={form.website}
            onChange={e => setForm({ ...form, website: e.target.value })}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Years of Experience *</label>
          <input
            type="number"
            min="0"
            max="50"
            value={form.experience_years}
            onChange={e => setForm({ ...form, experience_years: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="How many years of experience do you have?"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Motivation *</label>
          <textarea
            value={form.motivation}
            onChange={e => setForm({ ...form, motivation: e.target.value })}
            required
            rows={4}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Why do you want to become an owner? What are your goals?"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}