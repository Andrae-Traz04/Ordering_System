import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  fetchOrders,
  fetchSummary,
  fetchNotifications,
  updateStatus,
} from '../api/ordersApi'

const WORKFLOW = ['Pending', 'Processing', 'Shipped', 'Completed']

const STATUS_META = {
  Pending:    { color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B', next: 'Processing' },
  Processing: { color: '#6C47FF', bg: '#EDEAFF', dot: '#6C47FF', next: 'Shipped'    },
  Shipped:    { color: '#9B6DFF', bg: '#F3EEFF', dot: '#9B6DFF', next: 'Completed'  },
  Completed:  { color: '#10B981', bg: '#ECFDF5', dot: '#10B981', next: null         },
}

// ── Helpers ──────────────────────────────────────────────────────
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    setVal(0)
    const t = setTimeout(() => {
      if (!target) return
      let cur = 0
      const step = Math.max(1, Math.ceil(target / 25))
      const iv = setInterval(() => {
        cur = Math.min(cur + step, target)
        setVal(cur)
        if (cur >= target) clearInterval(iv)
      }, 32)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return val
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

// ── Sub-components ───────────────────────────────────────────────
function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.Pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color,
      padding: '4px 11px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

function WorkflowStepper({ status }) {
  const cur = WORKFLOW.indexOf(status)
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {WORKFLOW.map((s, i) => {
        const done   = i < cur
        const active = i === cur
        const m      = STATUS_META[s]
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div title={s} style={{
              width: active ? 10 : 7, height: active ? 10 : 7,
              borderRadius: '50%',
              background: done || active ? m.dot : '#E5E0F8',
              border: active ? `2px solid ${m.dot}` : 'none',
              boxShadow: active ? `0 0 0 3px ${m.bg}` : 'none',
              transition: 'all 0.25s', flexShrink: 0,
            }} />
            {i < WORKFLOW.length - 1 && (
              <div style={{ width: 18, height: 2, background: done ? STATUS_META[WORKFLOW[i + 1]].dot : '#E5E0F8' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, icon, prefix = '', delay, accentBg }) {
  const n = useCountUp(value, delay)
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '22px 20px',
      border: '1.5px solid #F0EBFF',
      boxShadow: '0 2px 14px rgba(155,109,255,0.07)',
      position: 'relative', overflow: 'hidden',
      animation: 'dashFadeUp 0.5s ease both', animationDelay: `${delay}ms`,
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(155,109,255,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 14px rgba(155,109,255,0.07)' }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 68, height: 68, background: accentBg || '#F3EEFF',
        borderRadius: '0 18px 0 68px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '10px 10px 0 0', fontSize: 18,
      }}>{icon}</div>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: '#2D1F6E', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {prefix}{typeof n === 'number' ? n.toLocaleString() : 0}
      </p>
    </div>
  )
}

function AdvanceButton({ order, onAdvanced }) {
  const [loading, setLoading] = useState(false)
  const meta = STATUS_META[order.status]
  if (!meta?.next) return null

  const handle = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await updateStatus(order.id, meta.next)
      onAdvanced()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  const nextMeta = STATUS_META[meta.next]
  return (
    <button onClick={handle} disabled={loading} style={{
      background: nextMeta?.bg || '#F3EEFF',
      color: nextMeta?.color || '#9B6DFF',
      border: `1.5px solid ${nextMeta?.dot || '#9B6DFF'}33`,
      borderRadius: 20, padding: '4px 11px',
      fontSize: 11, fontWeight: 700,
      cursor: loading ? 'wait' : 'pointer',
      fontFamily: 'inherit', transition: 'opacity 0.15s',
      opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
    }}>
      {loading ? '…' : `→ ${meta.next}`}
    </button>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [orders,        setOrders]        = useState([])
  const [summary,       setSummary]       = useState({})
  const [notifications, setNotifications] = useState([])
  const [filter,        setFilter]        = useState('All')
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersRes, summaryRes, notifRes] = await Promise.all([
        fetchOrders(),
        fetchSummary(),
        fetchNotifications(),
      ])
      setOrders(toArray(ordersRes.data))
      setSummary(summaryRes.data ?? {})
      setNotifications(toArray(notifRes.data))
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const stats = {
    total:      summary.total_orders ?? orders.length,
    pending:    summary.pending      ?? orders.filter(o => o.status === 'Pending').length,
    processing: summary.processing   ?? orders.filter(o => o.status === 'Processing').length,
    shipped:    summary.shipped      ?? orders.filter(o => o.status === 'Shipped').length,
    completed:  summary.completed    ?? orders.filter(o => o.status === 'Completed').length,
  }

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter)

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  return (
    <>
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 28, animation: 'dashFadeUp 0.4s ease both', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>
              Overview
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2D1F6E', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {greeting}, {user?.username || 'there'} 👋
            </h1>
            <p style={{ marginTop: 5, fontSize: 13, color: '#9B8FC0', fontWeight: 500 }}>
              Here's what's happening with your orders today.
            </p>
          </div>
          <button
            onClick={load}
            style={{
              background: '#F3EEFF', border: '1.5px solid #E0D8FF',
              borderRadius: 12, padding: '9px 16px',
              color: '#9B6DFF', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3EEFF'}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FFF0F0', border: '1.5px solid #FFD0CC', borderRadius: 14,
            padding: '12px 18px', marginBottom: 20, color: '#CC2200',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠️ {error}
            <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9B6DFF', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #F0EBFF', borderTopColor: '#9B6DFF', animation: 'dashSpin 0.8s linear infinite' }} />
            <span style={{ color: '#C4B8E8', fontWeight: 600 }}>Loading dashboard…</span>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
              <StatCard label="Total Orders"  value={stats.total}      icon="📦" delay={80}  accentBg="#F3EEFF" />
              <StatCard label="Pending"       value={stats.pending}    icon="⏳" delay={130} accentBg="#FFFBEB" />
              <StatCard label="Processing"    value={stats.processing} icon="⚙️" delay={180} accentBg="#EDEAFF" />
              <StatCard label="Shipped"       value={stats.shipped}    icon="🚚" delay={230} accentBg="#F3EEFF" />
              <StatCard label="Completed"     value={stats.completed}  icon="✅" delay={280} accentBg="#ECFDF5" />
            </div>

            {/* Workflow pipeline */}
            <div style={{
              background: '#fff', borderRadius: 18, border: '1.5px solid #F0EBFF',
              padding: '16px 22px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 0,
              boxShadow: '0 2px 12px rgba(155,109,255,0.06)',
              animation: 'dashFadeUp 0.5s ease both', animationDelay: '320ms',
              overflowX: 'auto',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 18, whiteSpace: 'nowrap' }}>
                Order Pipeline
              </span>
              {WORKFLOW.map((s, i) => {
                const m     = STATUS_META[s]
                const count = orders.filter(o => o.status === s).length
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div onClick={() => setFilter(s)} style={{
                      background: filter === s ? m.dot : m.bg,
                      borderRadius: 12, padding: '8px 18px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: filter === s ? '#fff' : m.color, lineHeight: 1 }}>{count}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: filter === s ? '#fff' : m.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{s}</span>
                    </div>
                    {i < WORKFLOW.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                        <div style={{ width: 20, height: 2, background: '#EDE9FE' }} />
                        <span style={{ color: '#C4B8E8', fontSize: 14 }}>›</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {filter !== 'All' && (
                <button onClick={() => setFilter('All')} style={{
                  marginLeft: 'auto', background: 'none', border: '1.5px solid #E0D8FF',
                  borderRadius: 20, padding: '5px 13px', color: '#9B6DFF',
                  fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>Clear ×</button>
              )}
            </div>

            {/* Orders table */}
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1.5px solid #F0EBFF',
              boxShadow: '0 2px 16px rgba(155,109,255,0.07)',
              overflow: 'hidden',
              animation: 'dashFadeUp 0.5s ease both', animationDelay: '400ms',
            }}>
              {/* Top bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1.5px solid #F7F4FF', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#2D1F6E' }}>
                  Recent Orders
                  {filter !== 'All' && <span style={{ marginLeft: 8, fontSize: 13, color: '#9B6DFF', fontWeight: 600 }}>— {filter}</span>}
                </h2>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {['All', ...WORKFLOW].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '5px 13px', borderRadius: 20, border: 'none',
                      background: filter === f ? 'linear-gradient(135deg,#9B6DFF,#7C3AED)' : '#F7F4FF',
                      color: filter === f ? '#fff' : '#9B8FC0',
                      fontWeight: 700, fontSize: 11, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>{f}</button>
                  ))}
                </div>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 170px 110px 120px', padding: '10px 22px', gap: 12, background: '#FAF8FF', borderBottom: '1.5px solid #F0EBFF' }}>
                {['Order ID', 'Customer', 'Total', 'Workflow', 'Status', 'Action'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{ padding: '60px 22px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  <p style={{ color: '#C4B8E8', fontWeight: 600 }}>No orders found</p>
                  {filter !== 'All' && (
                    <button onClick={() => setFilter('All')} style={{ marginTop: 10, background: 'none', border: 'none', color: '#9B6DFF', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                      Show all orders
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((o, i) => (
                  <div key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    style={{
                      display: 'grid', gridTemplateColumns: '110px 1fr 90px 170px 110px 120px',
                      padding: '13px 22px', gap: 12,
                      borderBottom: i < filtered.length - 1 ? '1.5px solid #FAF8FF' : 'none',
                      alignItems: 'center', cursor: 'pointer',
                      animation: 'dashFadeUp 0.4s ease both',
                      animationDelay: `${i * 45 + 430}ms`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAF8FF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#9B6DFF' }}>#{o.id}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2D1F6E' }}>
                        {o.customer_name || o.customer?.username || o.customer || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#C4B8E8', marginTop: 1 }}>{timeAgo(o.created_at)}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2D1F6E' }}>
                      ₱{parseFloat(o.total_price ?? o.total ?? 0).toLocaleString()}
                    </span>
                    <WorkflowStepper status={o.status} />
                    <StatusPill status={o.status} />
                    <AdvanceButton order={o} onAdvanced={load} />
                  </div>
                ))
              )}

              {/* Footer */}
              <div style={{ padding: '12px 22px', borderTop: '1.5px solid #F0EBFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF8FF' }}>
                <span style={{ fontSize: 12, color: '#C4B8E8', fontWeight: 600 }}>
                  Showing {filtered.length} of {orders.length} orders
                </span>
                <button onClick={() => navigate('/orders')} style={{
                  background: 'none', border: '1.5px solid #E0D8FF', borderRadius: 20,
                  padding: '5px 15px', color: '#9B6DFF', fontWeight: 700,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3EEFF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >View All →</button>
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div style={{
                marginTop: 20, background: '#fff', borderRadius: 20,
                border: '1.5px solid #F0EBFF',
                boxShadow: '0 2px 16px rgba(155,109,255,0.07)',
                overflow: 'hidden',
                animation: 'dashFadeUp 0.5s ease both', animationDelay: '480ms',
              }}>
                <div style={{ padding: '16px 22px 12px', borderBottom: '1.5px solid #F7F4FF' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#2D1F6E' }}>Notifications</h2>
                </div>
                {notifications.slice(0, 5).map((n, i) => (
                  <div key={n.id ?? i} style={{
                    padding: '12px 22px', display: 'flex', alignItems: 'flex-start', gap: 12,
                    borderBottom: i < Math.min(notifications.length, 5) - 1 ? '1.5px solid #FAF8FF' : 'none',
                    background: n.is_read ? 'transparent' : '#FAF8FF',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: n.is_read ? '#E5E0F8' : '#9B6DFF' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: '#2D1F6E', fontWeight: n.is_read ? 500 : 700, lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: '#C4B8E8', marginTop: 2 }}>{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}