import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchOrders, fetchSummary, fetchUsers, fetchCustomers,
  deleteOrder, updateStatus, updateUserRole,
  fetchOwnerApplications, reviewOwnerApplication,
} from '../api/ordersApi'

// ── Design tokens ────────────────────────────────────────────────
const C = {
  accent:   '#0f172a',
  accent2:  '#1e293b',
  blue:     '#3b82f6',
  blue2:    '#1d4ed8',
  blueBg:   '#eff6ff',
  red:      '#ef4444',
  redBg:    '#fef2f2',
  green:    '#10b981',
  greenBg:  '#ecfdf5',
  amber:    '#f59e0b',
  amberBg:  '#fffbeb',
  purple:   '#8b5cf6',
  purpleBg: '#f5f3ff',
  border:   '#e2e8f0',
  muted:    '#64748b',
  light:    '#94a3b8',
  white:    '#ffffff',
  bg:       '#f8fafc',
}

const STATUS = {
  pending:    { color: C.amber,  bg: C.amberBg,  label: 'Pending'    },
  processing: { color: C.blue,   bg: C.blueBg,   label: 'Processing' },
  shipped:    { color: C.purple, bg: C.purpleBg, label: 'Shipped'    },
  completed:  { color: C.green,  bg: C.greenBg,  label: 'Completed'  },
}

const ROLE_META = {
  customer: { color: C.blue,   bg: C.blueBg,   label: 'Customer' },
  owner:    { color: C.amber,  bg: C.amberBg,  label: 'Owner'    },
  admin:    { color: C.green,  bg: C.greenBg,  label: 'Admin'    },
}

// ── SVG Icons ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor', stroke = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke ? 'none' : color}
    stroke={stroke ? color : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const Icons = {
  orders:     ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  users:      ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75', 'M9 7a4 4 0 100 8 4 4 0 000-8z'],
  applications: ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  revenue:    ['M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'],
  trending:   ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  trash:      ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  shield:     ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  chart:      ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  check:      'M20 6L9 17l-5-5',
  arrow:      'M5 12h14M12 5l7 7-7 7',
  edit:       ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7', 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  customers:  ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'],
  refresh:    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  warning:    ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4M12 17h.01'],
}

// ── Reusable components ──────────────────────────────────────────
function StatusPill({ status }) {
  const m = STATUS[status?.toLowerCase()] || STATUS.pending
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:m.bg, color:m.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:'0.04em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color }} />
      {m.label}
    </span>
  )
}

function RolePill({ role }) {
  const m = ROLE_META[role] || ROLE_META.customer
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:m.bg, color:m.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:'0.04em' }}>
      {m.label}
    </span>
  )
}

function StatCard({ label, value, icon, accent, delay = 0 }) {
  return (
    <div style={{
      background: C.white, borderRadius:16, padding:'20px',
      border:`1px solid ${C.border}`,
      boxShadow:'0 1px 8px rgba(0,0,0,0.04)',
      animation:'fadeUp 0.5s ease both', animationDelay:`${delay}ms`,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, background:accent, borderRadius:'0 16px 0 60px', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'12px 12px 0 0', opacity:0.8 }}>
        <Icon d={Icons[icon]} size={20} color={C.white} />
      </div>
      <p style={{ fontSize:11, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</p>
      <p style={{ fontSize:30, fontWeight:800, color:C.accent, lineHeight:1 }}>{value}</p>
    </div>
  )
}

// ── Role Change Modal ────────────────────────────────────────────
function RoleModal({ user, onClose, onUpdated }) {
  const [role, setRole]       = useState(user.role)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const save = async () => {
    if (role === user.role) { onClose(); return }
    setSaving(true); setError('')
    try {
      await updateUserRole(user.id, role)
      onUpdated()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update role.')
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', zIndex:300, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', maxWidth:400, background:C.white, borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', zIndex:301, padding:'28px', animation:'modalIn 0.2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:C.blueBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={Icons.shield} size={20} color={C.blue} />
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:C.accent }}>Change Role</h3>
            <p style={{ fontSize:12, color:C.muted }}>@{user.username}</p>
          </div>
        </div>

        {error && (
          <div style={{ padding:'10px 14px', background:C.redBg, color:C.red, borderRadius:10, fontSize:13, fontWeight:600, marginBottom:14 }}>
            {error}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {['customer', 'owner', 'admin'].map(r => {
            const m = ROLE_META[r]
            return (
              <button key={r} onClick={() => setRole(r)} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                borderRadius:12, border:`2px solid ${role === r ? m.color : C.border}`,
                background: role === r ? m.bg : C.white,
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', textAlign:'left',
              }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background: role === r ? m.color : C.border, transition:'all 0.15s' }} />
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color: role === r ? m.color : C.accent }}>{m.label}</p>
                  <p style={{ fontSize:11, color:C.muted }}>
                    {r === 'customer' ? 'Browse products, place orders' : r === 'owner' ? 'Manage products and orders' : 'Full system access'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.muted, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background:saving ? C.border : C.blue2, color:C.white, fontWeight:700, fontSize:13, cursor:saving?'wait':'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Delete Confirm Modal ─────────────────────────────────────────
function DeleteOrderModal({ order, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  const handle = async () => {
    setDeleting(true)
    try { await deleteOrder(order.id); onDeleted(); onClose() }
    catch { setDeleting(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', zIndex:300, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', maxWidth:380, background:C.white, borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', zIndex:301, padding:'28px', animation:'modalIn 0.2s ease' }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:C.redBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Icon d={Icons.trash} size={24} color={C.red} />
          </div>
          <h3 style={{ fontSize:17, fontWeight:700, color:C.accent, marginBottom:8 }}>Delete Order?</h3>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>
            Permanently delete <strong style={{ color:C.accent }}>{order.order_number}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.muted, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handle} disabled={deleting} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:deleting?'#FCA5A5':C.red, color:C.white, fontWeight:700, fontSize:13, cursor:deleting?'wait':'pointer', fontFamily:'inherit' }}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Application Review Modal ──────────────────────────────────────
function ApplicationReviewModal({ app, onClose, onReviewed }) {
  const [status, setStatus] = useState('approved')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true); setError('')
    try {
      await reviewOwnerApplication(app.id, { status, review_notes: notes })
      onReviewed()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to review application.')
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', zIndex:300, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', maxWidth:480, background:C.white, borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.15)', zIndex:301, padding:'28px', animation:'modalIn 0.2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:C.amberBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={Icons.applications} size={20} color={C.amber} />
          </div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:C.accent }}>Review Application</h3>
            <p style={{ fontSize:12, color:C.muted }}>{app.business_name} by {app.user}</p>
          </div>
        </div>

        {error && (
          <div style={{ padding:'10px 14px', background:C.redBg, color:C.red, borderRadius:10, fontSize:13, fontWeight:600, marginBottom:14 }}>
            {error}
          </div>
        )}

        {/* Application Details */}
        <div style={{ background:C.bg, borderRadius:12, padding:16, marginBottom:20 }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:C.accent, marginBottom:12 }}>Application Details</h4>
          <div style={{ display:'grid', gap:8, fontSize:13 }}>
            <div><strong>Business:</strong> {app.business_name}</div>
            <div><strong>Description:</strong> {app.business_description}</div>
            <div><strong>Address:</strong> {app.business_address}</div>
            <div><strong>Phone:</strong> {app.phone_number}</div>
            <div><strong>Website:</strong> {app.website || 'Not provided'}</div>
            <div><strong>Experience:</strong> {app.experience_years} years</div>
            <div style={{ marginTop:8 }}><strong>Motivation:</strong></div>
            <div style={{ background:C.white, padding:10, borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.muted }}>
              {app.motivation}
            </div>
          </div>
        </div>

        {/* Review Options */}
        <div style={{ marginBottom:20 }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:C.accent, marginBottom:12 }}>Decision</h4>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { value: 'approved', label: 'Approve', color: C.green, bg: C.greenBg },
              { value: 'rejected', label: 'Reject', color: C.red, bg: C.redBg }
            ].map(option => (
              <button key={option.value} onClick={() => setStatus(option.value)} style={{
                flex:1, padding:'12px', borderRadius:12,
                border:`2px solid ${status === option.value ? option.color : C.border}`,
                background: status === option.value ? option.bg : C.white,
                color: status === option.value ? option.color : C.accent,
                fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'
              }}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.accent, marginBottom:6 }}>
            Review Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any notes about your decision..."
            rows={3}
            style={{ width:'100%', padding:12, border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:'inherit', resize:'vertical' }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.muted, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background:saving ? C.border : (status === 'approved' ? C.green : C.red), color:C.white, fontWeight:700, fontSize:13, cursor:saving?'wait':'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving...' : `Confirm ${status === 'approved' ? 'Approval' : 'Rejection'}`}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function AdminDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [tab,     setTab]    = useState('overview')

  // Data
  const [summary,   setSummary]   = useState(null)
  const [orders,    setOrders]    = useState([])
  const [users,        setUsers]        = useState([])
  const [customers,    setCustomers]    = useState([])
  const [applications, setApplications] = useState([])
  const [applicationModal, setApplicationModal] = useState(null)

  // UI
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter,   setRoleFilter]   = useState('')
  const [roleModal,    setRoleModal]    = useState(null)
  const [deleteModal,  setDeleteModal]  = useState(null)
  const [toast,        setToast]        = useState('')

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true); setError('')
    try {
      const [sRes, oRes, uRes, cRes, aRes] = await Promise.all([
        fetchSummary(), fetchOrders(), fetchUsers(), fetchCustomers(), fetchOwnerApplications(),
      ])
      setSummary(sRes.data)
      setOrders(oRes.data.orders || [])
      setUsers(uRes.data.users || [])
      setApplications(aRes.data.applications || [])
      setCustomers(cRes.data.customers || [])
    } catch {
      setError('Failed to load data. Is Django running?')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders
  const filteredUsers  = roleFilter   ? users.filter(u => u.role === roleFilter)       : users

  const tabs = [
    { id: 'overview',     label: 'Overview',     icon: Icons.chart       },
    { id: 'orders',       label: 'Orders',       icon: Icons.orders      },
    { id: 'users',        label: 'Users',        icon: Icons.users       },
    { id: 'customers',    label: 'Customers',    icon: Icons.customers   },
    { id: 'applications', label: 'Applications', icon: Icons.applications },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:translate(-50%,-48%) scale(0.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:400, background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 18px', fontSize:13, fontWeight:600, color:C.accent, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:8 }}>
          <Icon d={Icons.check} size={14} color={C.green} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, animation:'fadeUp 0.4s ease both' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg, #0f172a, #1e293b)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={Icons.shield} size={14} color={C.white} />
            </div>
            <p style={{ fontSize:11, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.1em' }}>Admin Control</p>
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.accent }}>System Administration</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:2 }}>Full access to all system data and controls</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.muted, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          <Icon d={Icons.refresh} size={14} color={C.muted} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:C.redBg, color:C.red, borderRadius:12, marginBottom:20, fontSize:13, fontWeight:600 }}>
          <Icon d={Icons.warning} size={16} color={C.red} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:C.bg, borderRadius:12, padding:4, border:`1px solid ${C.border}`, width:'fit-content', animation:'fadeUp 0.4s ease both', animationDelay:'60ms' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:9, border:'none',
            background: tab === t.id ? C.white : 'transparent',
            color: tab === t.id ? C.accent : C.muted,
            fontWeight: tab === t.id ? 700 : 500, fontSize:13,
            cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            <Icon d={t.icon} size={14} color={tab === t.id ? C.accent : C.muted} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTopColor:C.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
          <p style={{ color:C.light, fontWeight:600 }}>Loading data...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && summary && (
            <div style={{ animation:'fadeUp 0.35s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:14, marginBottom:24 }}>
                <StatCard label="Total Orders"   value={summary.total_orders}               icon="orders"   accent="#3b82f6" delay={0}   />
                <StatCard label="Pending"         value={summary.by_status?.pending || 0}    icon="warning"  accent="#f59e0b" delay={60}  />
                <StatCard label="Completed"       value={summary.by_status?.completed || 0}  icon="check"    accent="#10b981" delay={120} />
                <StatCard label="Total Users"     value={users.length}                       icon="users"    accent="#8b5cf6" delay={180} />
                <StatCard label="Customers"       value={customers.length}                   icon="customers" accent="#0ea5e9" delay={240} />
                <StatCard label="Revenue (₱)"    value={`₱${parseFloat(summary.total_revenue || 0).toFixed(0)}`} icon="revenue" accent="#059669" delay={300} />
              </div>

              {/* Role breakdown */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
                <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'20px', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:C.accent, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                    <Icon d={Icons.users} size={16} color={C.blue} /> User Roles Breakdown
                  </h3>
                  {['customer', 'owner', 'admin'].map(r => {
                    const count = users.filter(u => u.role === r).length
                    const pct   = users.length ? Math.round((count / users.length) * 100) : 0
                    const m     = ROLE_META[r]
                    return (
                      <div key={r} style={{ marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>{m.label}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height:6, background:C.bg, borderRadius:99 }}>
                          <div style={{ height:6, width:`${pct}%`, background:m.color, borderRadius:99, transition:'width 0.5s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'20px', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:C.accent, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                    <Icon d={Icons.chart} size={16} color={C.blue} /> Order Status Breakdown
                  </h3>
                  {Object.entries(STATUS).map(([key, m]) => {
                    const count = (summary.by_status || {})[key] || 0
                    const pct   = summary.total_orders ? Math.round((count / summary.total_orders) * 100) : 0
                    return (
                      <div key={key} style={{ marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>{m.label}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height:6, background:C.bg, borderRadius:99 }}>
                          <div style={{ height:6, width:`${pct}%`, background:m.color, borderRadius:99, transition:'width 0.5s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS TAB ── */}
          {tab === 'orders' && (
            <div style={{ animation:'fadeUp 0.35s ease both' }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {['', ...Object.keys(STATUS)].map(s => {
                  const m = s ? STATUS[s] : null
                  return (
                    <button key={s||'all'} onClick={() => setStatusFilter(s)} style={{
                      padding:'6px 14px', borderRadius:20, border:'none',
                      background: statusFilter === s ? (s ? m.color : C.accent2) : (s ? m?.bg : C.bg),
                      color: statusFilter === s ? C.white : (s ? m?.color : C.muted),
                      fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                      border: `1px solid ${statusFilter === s ? 'transparent' : C.border}`,
                      transition:'all 0.15s',
                    }}>
                      {s ? STATUS[s].label : 'All Orders'}
                      <span style={{ marginLeft:5, fontSize:11, opacity:0.8 }}>
                        ({s ? orders.filter(o=>o.status===s).length : orders.length})
                      </span>
                    </button>
                  )
                })}
              </div>

              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 90px 110px 110px 80px', padding:'10px 20px', gap:12, background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                  {['Order #','Customer','Total','Status','Date','Action'].map(h => (
                    <span key={h} style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
                  ))}
                </div>
                {filteredOrders.length === 0 ? (
                  <div style={{ padding:'60px', textAlign:'center', color:C.light, fontSize:13, fontWeight:600 }}>No orders found</div>
                ) : filteredOrders.map((o, i) => (
                  <div key={o.id} style={{
                    display:'grid', gridTemplateColumns:'130px 1fr 90px 110px 110px 80px',
                    padding:'13px 20px', gap:12, alignItems:'center',
                    borderBottom: i < filteredOrders.length-1 ? `1px solid ${C.bg}` : 'none',
                    transition:'background 0.12s',
                    animation:'fadeUp 0.4s ease both', animationDelay:`${i*35}ms`,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <button onClick={() => navigate(`/orders/${o.id}`)} style={{ background:'none', border:'none', fontSize:12, fontWeight:700, color:C.blue, cursor:'pointer', fontFamily:'inherit', textAlign:'left', padding:0 }}>
                      {o.order_number}
                    </button>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:C.accent }}>{o.customer_name || '—'}</p>
                      <p style={{ fontSize:11, color:C.light }}>{o.customer_email || ''}</p>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>₱{parseFloat(o.total_amount||0).toFixed(2)}</span>
                    <StatusPill status={o.status} />
                    <span style={{ fontSize:11, color:C.light }}>{new Date(o.created_at).toLocaleDateString()}</span>
                    {/* Admin-only: delete button */}
                    <button onClick={() => setDeleteModal(o)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:`1px solid #fecaca`, background:C.redBg, cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background=C.red; e.currentTarget.querySelector('svg').style.stroke=C.white}}
                      onMouseLeave={e=>{e.currentTarget.style.background=C.redBg; e.currentTarget.querySelector('svg').style.stroke=C.red}}
                      title="Delete order">
                      <Icon d={Icons.trash} size={14} color={C.red} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS TAB — Admin exclusive ── */}
          {tab === 'users' && (
            <div style={{ animation:'fadeUp 0.35s ease both' }}>
              <div style={{ background:C.blueBg, border:`1px solid #bfdbfe`, borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.blue2, fontWeight:600 }}>
                <Icon d={Icons.shield} size={16} color={C.blue} />
                Admin exclusive: You can change user roles to control what they can access.
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {['', 'customer', 'owner', 'admin'].map(r => (
                  <button key={r||'all'} onClick={() => setRoleFilter(r)} style={{
                    padding:'6px 14px', borderRadius:20, border:`1px solid ${roleFilter===r ? 'transparent' : C.border}`,
                    background: roleFilter===r ? C.accent2 : C.white,
                    color: roleFilter===r ? C.white : C.muted,
                    fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                  }}>
                    {r ? ROLE_META[r].label : 'All Users'}
                    <span style={{ marginLeft:5, fontSize:11, opacity:0.8 }}>
                      ({r ? users.filter(u=>u.role===r).length : users.length})
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 1fr 120px 130px 100px', padding:'10px 20px', gap:12, background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                  {['ID','Username','Email','Role','Joined','Action'].map(h => (
                    <span key={h} style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
                  ))}
                </div>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding:'60px', textAlign:'center', color:C.light, fontSize:13, fontWeight:600 }}>No users found</div>
                ) : filteredUsers.map((u, i) => (
                  <div key={u.id} style={{
                    display:'grid', gridTemplateColumns:'50px 1fr 1fr 120px 130px 100px',
                    padding:'13px 20px', gap:12, alignItems:'center',
                    borderBottom: i < filteredUsers.length-1 ? `1px solid ${C.bg}` : 'none',
                    transition:'background 0.12s',
                    animation:'fadeUp 0.4s ease both', animationDelay:`${i*35}ms`,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <span style={{ fontSize:11, color:C.light }}>#{u.id}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:ROLE_META[u.role]?.bg || C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:ROLE_META[u.role]?.color || C.muted }}>
                        {u.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>{u.username}</span>
                      {u.id === user?.id && <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20, background:C.greenBg, color:C.green }}>You</span>}
                    </div>
                    <span style={{ fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email || '—'}</span>
                    <RolePill role={u.role} />
                    <span style={{ fontSize:11, color:C.light }}>{new Date(u.date_joined || Date.now()).toLocaleDateString()}</span>
                    {/* Admin-only: change role */}
                    {u.id !== user?.id ? (
                      <button onClick={() => setRoleModal(u)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.muted, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; e.currentTarget.style.background=C.blueBg}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; e.currentTarget.style.background=C.white}}>
                        <Icon d={Icons.edit} size={12} color="currentColor" />
                        Role
                      </button>
                    ) : (
                      <span style={{ fontSize:11, color:C.light }}>—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CUSTOMERS TAB ── */}
          {tab === 'customers' && (
            <div style={{ animation:'fadeUp 0.35s ease both' }}>
              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 120px 130px 100px', padding:'10px 20px', gap:12, background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                  {['Name','Email','Phone','Orders','Joined'].map(h => (
                    <span key={h} style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
                  ))}
                </div>
                {customers.length === 0 ? (
                  <div style={{ padding:'60px', textAlign:'center', color:C.light, fontSize:13, fontWeight:600 }}>No customers yet</div>
                ) : customers.map((c, i) => (
                  <div key={c.id} style={{
                    display:'grid', gridTemplateColumns:'1fr 1fr 120px 130px 100px',
                    padding:'13px 20px', gap:12, alignItems:'center',
                    borderBottom: i < customers.length-1 ? `1px solid ${C.bg}` : 'none',
                    transition:'background 0.12s',
                    animation:'fadeUp 0.4s ease both', animationDelay:`${i*35}ms`,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:C.blueBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:C.blue }}>
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.email}</span>
                    <span style={{ fontSize:12, color:C.muted }}>{c.phone || '—'}</span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:C.blue }}>
                      <Icon d={Icons.orders} size={12} color={C.blue} /> {c.order_count} order{c.order_count !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize:11, color:C.light }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── APPLICATIONS TAB ── */}
          {tab === 'applications' && (
            <div style={{ animation:'fadeUp 0.35s ease both' }}>
              <div style={{ background:C.amberBg, border:`1px solid #fcd34d`, borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.amber.replace('f59e0b', '92400e'), fontWeight:600 }}>
                <Icon d={Icons.applications} size={16} color={C.amber} />
                Review owner applications from customers who want to become owners.
              </div>

              <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 1fr 120px 130px 120px', padding:'10px 20px', gap:12, background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                  {['ID','Business','User','Status','Applied','Action'].map(h => (
                    <span key={h} style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
                  ))}
                </div>
                {applications.length === 0 ? (
                  <div style={{ padding:'60px', textAlign:'center', color:C.light, fontSize:13, fontWeight:600 }}>No applications yet</div>
                ) : applications.map((app, i) => (
                  <div key={app.id} style={{
                    display:'grid', gridTemplateColumns:'50px 1fr 1fr 120px 130px 120px',
                    padding:'13px 20px', gap:12, alignItems:'center',
                    borderBottom: i < applications.length-1 ? `1px solid ${C.bg}` : 'none',
                    transition:'background 0.12s',
                    animation:'fadeUp 0.4s ease both', animationDelay:`${i*35}ms`,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <span style={{ fontSize:11, color:C.light }}>#{app.id}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:C.amberBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:C.amber }}>
                        {app.business_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.accent }}>{app.business_name}</div>
                        <div style={{ fontSize:11, color:C.muted, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.business_description}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:12, color:C.muted }}>{app.user}</span>
                    <div style={{
                      padding:'4px 8px', borderRadius:12, fontSize:10, fontWeight:700, textAlign:'center',
                      background: app.status === 'approved' ? C.greenBg : app.status === 'rejected' ? C.redBg : C.amberBg,
                      color: app.status === 'approved' ? C.green : app.status === 'rejected' ? C.red : C.amber,
                    }}>
                      {app.status}
                    </div>
                    <span style={{ fontSize:11, color:C.light }}>{new Date(app.submitted_at).toLocaleDateString()}</span>
                    {app.status === 'pending' ? (
                      <button onClick={() => setApplicationModal(app)} style={{
                        display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8,
                        border:`1px solid ${C.border}`, background:C.white, color:C.muted, fontWeight:600,
                        fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'
                      }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.amber; e.currentTarget.style.color=C.amber; e.currentTarget.style.background=C.amberBg}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; e.currentTarget.style.background=C.white}}>
                        <Icon d={Icons.edit} size={12} color="currentColor" />
                        Review
                      </button>
                    ) : (
                      <span style={{ fontSize:11, color:C.light }}>Reviewed {new Date(app.reviewed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {roleModal        && <RoleModal             user={roleModal}        onClose={() => setRoleModal(null)}        onUpdated={() => { load(); notify(`Role updated for ${roleModal.username}`) }} />}
      {deleteModal      && <DeleteOrderModal      order={deleteModal}     onClose={() => setDeleteModal(null)}     onDeleted={() => { load(); notify(`Order ${deleteModal.order_number} deleted`) }} />}
      {applicationModal && <ApplicationReviewModal app={applicationModal} onClose={() => setApplicationModal(null)} onReviewed={() => { load(); notify(`Application reviewed for ${applicationModal.business_name}`) }} />}
    </>
  )
}