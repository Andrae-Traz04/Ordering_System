import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchSummary, fetchOrders } from '@/api/ordersApi'

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [sRes, oRes] = await Promise.all([
        fetchSummary(),
        fetchOrders(),
      ])
      setSummary(sRes.data)
      setOrders(oRes.data || [])
    } catch (err) {
      setError('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  if (loading && !summary && !error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p style={{ color: '#C4B8E8', fontWeight: 600 }}>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
          background: #fff;
          borderRadius: 18;
          padding: '22px 20px';
          border: '1.5px solid #F0EBFF';
          boxShadow: '0 2px 14px rgba(155,109,255,0.07)";
          position: relative;
          overflow: hidden;
          animation: dashFadeUp 0.5s ease both;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(155,109,255,0.14);
        }
        .stat-icon {
          position: absolute;
          top: 0;
          right: 0;
          width: 68px;
          height: 68px;
          borderRadius: '0 18px 0 68px';
          display: flex;
          alignItems: flex-start;
          justifyContent: flex-end;
          padding: '10px 10px 0 0';
          fontSize: 18px;
        }
        .stat-label {
          fontSize: 10px;
          fontWeight: 700;
          color: #C4B8E8;
          letterSpacing: 0.12em;
          textTransform: uppercase;
          marginBottom: 8px;
        }
        .stat-value {
          fontSize: 32px;
          fontWeight: 800;
          color: #2D1F6E;
          letterSpacing: -0.02em;
          lineHeight: 1;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, animation: 'dashFadeUp 0.4s ease both' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Admin Analytics
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2D1F6E' }}>
            Overview
          </h1>
        </div>
        <button onClick={loadAnalytics} style={{
          background: 'none', border: '1.5px solid #E0D8FF', borderRadius: 20,
          padding: '8px 18px', color: '#9B6DFF', fontWeight: 700, fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>↻ Refresh</button>
      </div>

      {/* Stats */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div className="stat-card" style={{ animationDelay: '0ms' }}>
            <div className="stat-icon" style={{ background: '#EDE9FE' }}>📦</div>
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{summary.total_orders?.toLocaleString() ?? 0}</p>
          </div>
          <div className="stat-card" style={{ animationDelay: '80ms' }}>
            <div className="stat-icon" style={{ background: '#FFFBEB' }}>⏳</div>
            <p className="stat-label">Pending</p>
            <p className="stat-value">{summary.by_status?.pending?.toLocaleString() ?? 0}</p>
          </div>
          <div className="stat-card" style={{ animationDelay: '160ms' }}>
            <div className="stat-icon" style={{ background: '#EDEAFF' }}>⚙️</div>
            <p className="stat-label">Processing</p>
            <p className="stat-value">{summary.by_status?.processing?.toLocaleString() ?? 0}</p>
          </div>
          <div className="stat-card" style={{ animationDelay: '240ms' }}>
            <div className="stat-icon" style={{ background: '#F3EEFF' }}>🚚</div>
            <p className="stat-label">Shipped</p>
            <p className="stat-value">{summary.by_status?.shipped?.toLocaleString() ?? 0}</p>
          </div>
          <div className="stat-card" style={{ animationDelay: '320ms' }}>
            <div className="stat-icon" style={{ background: '#ECFDF5' }}>✅</div>
            <p className="stat-label">Completed</p>
            <p className="stat-value">{summary.by_status?.completed?.toLocaleString() ?? 0}</p>
          </div>
          <div className="stat-card" style={{ animationDelay: '400ms' }}>
            <div className="stat-icon" style={{ background: '#FEF3C7' }}>💰</div>
            <p className="stat-label">Revenue (₱)</p>
            <p className="stat-value">{Math.floor(parseFloat(summary.total_revenue || 0)).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F0EBFF', boxShadow: '0 2px 16px rgba(155,109,255,0.07)', overflow: 'hidden', animation: 'dashFadeUp 0.5s ease both', animationDelay: '400ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1.5px solid #F7F4FF', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#2D1F6E' }}>Recent Orders</h2>
          <span style={{ fontSize: 13, color: '#9B6DFF', fontWeight: 600 }}>{orders.length} orders</span>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 170px 110px 120px', padding: '10px 22px', gap: 12, background: '#FAF8FF', borderBottom: '1.5px solid #F0EBFF' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order #</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Customer</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Status</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#C4B8E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Action</span>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div style={{ padding: '60px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <p style={{ color: '#C4B8E8', fontWeight: 600 }}>No orders found</p>
          </div>
        ) : (
          orders.slice(0, 10).map((o, i) => (
            <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 170px 110px 120px', padding: '13px 22px', gap: 12, borderBottom: i < 9 ? '1.5px solid #FAF8FF' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : '#FAF8FF' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9B6DFF' }}>{o.order_number}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2D1F6E' }}>{o.customer_name || '—'}</div>
                <div style={{ fontSize: 11, color: '#C4B8E8', marginTop: 1 }}>{new Date(o.created_at).toLocaleDateString('en-PH')}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2D1F6E' }}>
                ₱{parseFloat(o.total_amount || 0).toLocaleString()}
              </span>
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: o.status ? '#EDEAFF' : '#F7F4FF',
                color: o.status ? '#6C47FF' : '#9B8FC0',
                padding: '4px 11px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
              }}>
                {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : '—'}
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => { /* view detail */ }} style={{ flex: 1, padding: '5px 10px', borderRadius: 8, border: '1px solid #E0D8FF', background: '#fff', color: '#9B6DFF', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AnalyticsPage