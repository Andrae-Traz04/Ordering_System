import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchOrders,
  fetchSummary,
  fetchNotifications,
} from '../api/ordersApi'

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

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()

  const [orders,        setOrders]        = useState([])
  const [summary,       setSummary]       = useState({})
  const [notifications, setNotifications] = useState([])
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

            {/* Notifications */}
            {notifications.length > 0 && (
              <div style={{
                marginTop: 20, background: '#fff', borderRadius: 20,
                border: '1.5px solid #F0EBFF',
                boxShadow: '0 2px 16px rgba(155,109,255,0.07)',
                overflow: 'hidden',
                animation: 'dashFadeUp 0.5s ease both', animationDelay: '320ms',
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