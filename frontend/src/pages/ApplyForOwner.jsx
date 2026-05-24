import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createOwnerApplication } from '@/api/ordersApi'
import { getApiErrorMessage } from '@/api/getApiErrorMessage'

// ── Design tokens ────────────────────────────────────────────────
const C = {
  primary:   '#7C3AED',
  primary2:  '#9B6DFF',
  softBg:    '#F3EEFF',
  softBg2:   '#EDEAFF',
  border:    '#F0EBFF',
  border2:   '#E0D8FF',
  dark:      '#2D1F6E',
  mid:       '#9B8FC0',
  light:     '#C4B8E8',
  white:     '#fff',
  pageBg:    '#FAF8FF',
  success:   '#10B981',
  successBg: '#ECFDF5',
  warn:      '#F59E0B',
  warnBg:    '#FFFBEB',
  red:       '#ef4444',
  redBg:     '#fef2f2',
}

// ── SVG Icons ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor', stroke = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke ? 'none' : color}
    stroke={stroke ? color : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const Icons = {
  building: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  globe: ['M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9m-9 9a9 9 0 019 9'],
  briefcase: ['M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V8a2 2 0 002 2h4a2 2 0 002-2V6'],
  target: ['M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'],
  check: 'M20 6L9 17l-5-5',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
}

// ── Stepper Component ─────────────────────────────────────────────
function Stepper({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 8 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: i <= currentStep ? C.primary : C.border,
            color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold'
          }}>
            {i < currentStep ? <Icon d={Icons.check} size={16} color={C.white} /> : i + 1}
          </div>
          <span style={{
            marginLeft: 8, fontSize: 14, color: i <= currentStep ? C.dark : C.mid, fontWeight: i === currentStep ? 'bold' : 'normal'
          }}>
            {step}
          </span>
          {i < steps.length - 1 && (
            <div style={{
              width: 40, height: 2, background: i < currentStep ? C.primary : C.border, marginLeft: 8, marginRight: 8
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Form Field Component ───────────────────────────────────────────
function FormField({ label, icon, error, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 'bold', fontSize: 14, color: C.dark }}>
        {icon && <Icon d={Icons[icon]} size={16} color={C.primary} style={{ marginRight: 8 }} />}
        {label} {required && <span style={{ color: C.red }}>*</span>}
      </label>
      {children}
      {error && <span style={{ color: C.red, fontSize: 12, marginTop: 4, display: 'block' }}>{error}</span>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────
export default function ApplyForOwner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState({
    business_name: '',
    business_description: '',
    business_address: '',
    phone_number: '',
    website: '',
    experience_years: '',
    motivation: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const steps = ['Business Info', 'Contact Details', 'Experience & Motivation']

  const validateStep = (step) => {
    const newErrors = {}
    if (step === 0) {
      if (!form.business_name.trim()) newErrors.business_name = 'Business name is required'
      if (!form.business_description.trim()) newErrors.business_description = 'Business description is required'
      if (!form.business_address.trim()) newErrors.business_address = 'Business address is required'
    } else if (step === 1) {
      if (!form.phone_number.trim()) newErrors.phone_number = 'Phone number is required'
      if (form.website && !/^https?:\/\/.+/.test(form.website)) newErrors.website = 'Website must be a valid URL'
    } else if (step === 2) {
      if (!form.experience_years || isNaN(form.experience_years) || form.experience_years < 0) newErrors.experience_years = 'Valid experience years required'
      if (!form.motivation.trim()) newErrors.motivation = 'Motivation is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const submit = async () => {
    if (!validateStep(currentStep)) return
    setLoading(true)

    try {
      await createOwnerApplication({
        ...form,
        experience_years: parseInt(form.experience_years)
      })
      alert('Application submitted successfully! You will be notified once reviewed.')
      navigate('/profile')
    } catch (err) {
      alert(getApiErrorMessage(err, 'Application submission failed.'))
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
    <div style={{
      maxWidth: 800, margin: '0 auto', padding: 24, background: C.white,
      borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minHeight: '70vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ color: C.dark, marginBottom: 8 }}>Apply for Owner Status</h1>
        <p style={{ color: C.mid }}>Complete the form to apply for owner privileges in our ordering system.</p>
      </div>

      <Stepper steps={steps} currentStep={currentStep} />

      <div style={{ padding: 24, background: C.pageBg, borderRadius: 12, marginBottom: 24 }}>
        {currentStep === 0 && (
          <>
            <FormField label="Business Name" icon="building" required error={errors.business_name}>
              <input
                type="text"
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.business_name ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
                }}
                placeholder="Your business or store name"
              />
            </FormField>

            <FormField label="Business Description" required error={errors.business_description}>
              <textarea
                value={form.business_description}
                onChange={e => setForm({ ...form, business_description: e.target.value })}
                rows={4}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.business_description ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical'
                }}
                placeholder="Describe your business, what you sell, target market, etc."
              />
            </FormField>

            <FormField label="Business Address" required error={errors.business_address}>
              <textarea
                value={form.business_address}
                onChange={e => setForm({ ...form, business_address: e.target.value })}
                rows={3}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.business_address ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical'
                }}
                placeholder="Full business address including city, state, zip"
              />
            </FormField>
          </>
        )}

        {currentStep === 1 && (
          <>
            <FormField label="Phone Number" icon="phone" required error={errors.phone_number}>
              <input
                type="tel"
                value={form.phone_number}
                onChange={e => setForm({ ...form, phone_number: e.target.value })}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.phone_number ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none'
                }}
                placeholder="+1-555-123-4567"
              />
            </FormField>

            <FormField label="Website" icon="globe" error={errors.website}>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.website ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none'
                }}
                placeholder="https://yourwebsite.com (optional)"
              />
            </FormField>
          </>
        )}

        {currentStep === 2 && (
          <>
            <FormField label="Years of Experience" icon="briefcase" required error={errors.experience_years}>
              <input
                type="number"
                min="0"
                max="50"
                value={form.experience_years}
                onChange={e => setForm({ ...form, experience_years: e.target.value })}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.experience_years ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none'
                }}
                placeholder="How many years of experience do you have?"
              />
            </FormField>

            <FormField label="Motivation" icon="target" required error={errors.motivation}>
              <textarea
                value={form.motivation}
                onChange={e => setForm({ ...form, motivation: e.target.value })}
                rows={5}
                style={{
                  width: '100%', padding: 12, border: `1px solid ${errors.motivation ? C.red : C.border}`,
                  borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical'
                }}
                placeholder="Why do you want to become an owner? What are your goals and how will you contribute?"
              />
            </FormField>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          style={{
            padding: '12px 24px', background: C.white, color: C.primary, border: `1px solid ${C.border}`,
            borderRadius: 8, cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 'bold'
          }}
        >
          <Icon d={Icons.arrowLeft} size={16} /> Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            style={{
              padding: '12px 24px', background: C.primary, color: C.white, border: 'none',
              borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 14, fontWeight: 'bold'
            }}
          >
            Next <Icon d={Icons.arrowRight} size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: '12px 24px', background: C.success, color: C.white, border: 'none',
              borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 'bold'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>
    </div>
  )
}