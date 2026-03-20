import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchOrders, fetchSummary, createOrder } from '../api/ordersApi'

// ── Color Palette ────────────────────────────────────────────────
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
  success:   '#10B981',
  successBg: '#ECFDF5',
  warn:      '#F59E0B',
  warnBg:    '#FFFBEB',
}

const PRODUCTS = [
  { id: 1, name: 'Gift Box',       emoji: '🎁', price: 14,  category: 'Gifts',       badge: 'Best Seller', desc: 'Premium gift box set'            },
  { id: 2, name: 'Face Cream',     emoji: '🧴', price: 23,  category: 'Beauty',      badge: 'New',         desc: 'Moisturize & take care'          },
  { id: 3, name: 'Dumbbell Set',   emoji: '🏋️', price: 17,  category: 'Fitness',     badge: null,          desc: 'Exercise dumbbells'              },
  { id: 4, name: 'Digital Camera', emoji: '📷', price: 314, category: 'Electronics', badge: 'Popular',     desc: 'Choose between DSLR, mirrorless' },
  { id: 5, name: 'Coffee Cup',     emoji: '☕', price: 3,   category: 'Kitchen',     badge: 'New',         desc: 'Coffee cup with lid'             },
  { id: 6, name: 'Smartwatch',     emoji: '⌚', price: 89,  category: 'Electronics', badge: 'Best Seller', desc: 'Find the best price'             },
  { id: 7, name: 'Remote Control', emoji: '📱', price: 31,  category: 'Electronics', badge: null,          desc: 'Best universal remote'           },
  { id: 8, name: 'Laptop',         emoji: '💻', price: 451, category: 'Electronics', badge: 'Popular',     desc: 'The best laptops deals'          },
]

const CATEGORIES = ['All', 'Electronics', 'Beauty', 'Fitness', 'Gifts', 'Kitchen']

const STATUS_META = {
  Pending:    { color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
  Processing: { color: '#6C47FF', bg: '#EDEAFF', dot: '#6C47FF' },
  Shipped:    { color: '#9B6DFF', bg: '#F3EEFF', dot: '#9B6DFF' },
  Completed:  { color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
  // lowercase variants (backend returns lowercase)
  pending:    { color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
  processing: { color: '#6C47FF', bg: '#EDEAFF', dot: '#6C47FF' },
  shipped:    { color: '#9B6DFF', bg: '#F3EEFF', dot: '#9B6DFF' },
  completed:  { color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
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
  if (Array.isArray(data))          return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.orders))  return data.orders
  return []
}

// ── StatusPill ───────────────────────────────────────────────────
function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color,
      padding: '4px 11px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ── StatCard ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, delay, accentBg }) {
  const n = useCountUp(value, delay)
  return (
    <div style={{
      background: C.white, borderRadius: 18, padding: '20px 18px',
      border: `1.5px solid ${C.border}`,
      boxShadow: '0 2px 14px rgba(155,109,255,0.07)',
      position: 'relative', overflow: 'hidden',
      animation: 'fadeUp 0.5s ease both', animationDelay: `${delay}ms`,
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(155,109,255,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 14px rgba(155,109,255,0.07)' }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60, background: accentBg || C.softBg,
        borderRadius: '0 18px 0 60px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '8px 8px 0 0', fontSize: 16,
      }}>{icon}</div>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.light, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: C.dark, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {typeof n === 'number' ? n.toLocaleString() : 0}
      </p>
    </div>
  )
}

// ── Cart Sidebar ─────────────────────────────────────────────────
function CartSidebar({ cart, onClose, onUpdateQty, onRemove, onPlaceOrder, placing }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,110,0.18)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: C.white, zIndex: 201,
        boxShadow: '-8px 0 40px rgba(124,58,237,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>
            🛒 My Cart <span style={{ fontSize: 13, color: C.mid, fontWeight: 600 }}>({cart.length} items)</span>
          </h2>
          <button onClick={onClose} style={{ background: C.softBg, border: 'none', borderRadius: 10, width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: C.primary }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.light }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <p style={{ fontWeight: 600 }}>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1.5px solid ${C.border}` }}>
              <div style={{ width: 48, height: 48, background: C.softBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                <p style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>₱{item.price}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => onUpdateQty(item.id, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: 8, border: `1.5px solid ${C.border2}`, background: C.white, color: C.primary, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>−</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.dark, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: 8, border: `1.5px solid ${C.border2}`, background: C.white, color: C.primary, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>+</button>
              </div>
              <button onClick={() => onRemove(item.id)} style={{ background: '#FFF0F0', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#CC2200', fontSize: 13 }}>🗑</button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 22px', borderTop: `1.5px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.mid }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>₱{total.toLocaleString()}</span>
            </div>
            <button onClick={onPlaceOrder} disabled={placing} style={{
              width: '100%', padding: '13px', borderRadius: 14,
              background: placing ? C.light : `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
              color: C.white, border: 'none',
              fontWeight: 800, fontSize: 15, cursor: placing ? 'wait' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
            }}>
              {placing ? '⏳ Placing Order…' : '✅ Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab,          setTab]          = useState('shop')
  const [orders,       setOrders]       = useState([])
  const [summary,      setSummary]      = useState({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [cart,         setCart]         = useState([])
  const [cartOpen,     setCartOpen]     = useState(false)
  const [placing,      setPlacing]      = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [category,     setCategory]     = useState('All')
  const [search,       setSearch]       = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [ordersRes, summaryRes] = await Promise.all([fetchOrders(), fetchSummary()])
      setOrders(toArray(ordersRes.data))
      setSummary(summaryRes.data ?? {})
    } catch { setError('Failed to load data.') }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Backend returns by_status.pending (lowercase) ──
  const byStatus = summary.by_status ?? {}
  const stats = {
    total:     summary.total_orders  ?? orders.length,
    pending:   byStatus.pending      ?? orders.filter(o => o.status === 'pending').length,
    shipped:   byStatus.shipped      ?? orders.filter(o => o.status === 'shipped').length,
    completed: byStatus.completed    ?? orders.filter(o => o.status === 'completed').length,
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const filteredProducts = PRODUCTS.filter(p =>
    (category === 'All' || p.category === category) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id))
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  // ── placeOrder — matches backend OrderCreateSerializer exactly ──
  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      // Ensure email is always valid format
      const rawEmail = user?.email || ""
      const safeEmail = rawEmail.includes("@")
        ? rawEmail
        : `${(user?.username || "customer").replace(/[^a-zA-Z0-9]/g, "")}@orders.local`

      const payload = {
        customer_name:  user?.username || 'Customer',
        customer_email: safeEmail,
        customer_phone: '',
        notes:          '',
        items: cart.map(i => ({
          product_name: i.name,
          quantity:     i.qty,
          unit_price:   i.price,
        })),
      }
      await createOrder(payload)
      setCart([])
      setCartOpen(false)
      setOrderSuccess(true)
      setTimeout(() => setOrderSuccess(false), 4000)
      await load()
      setTab('orders')
    } catch (err) {
      const data = err?.response?.data
      const msg  = data
        ? Object.values(data).flat().join(', ')
        : 'Failed to place order. Please try again.'
      alert(msg)
    } finally { setPlacing(false) }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to   { transform:rotate(360deg) } }
        @keyframes slideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
        @keyframes popIn   { from { opacity:0; transform:scale(0.9) } to { opacity:1; transform:scale(1) } }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12, animation: 'fadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>My Store</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.dark, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {greeting}, {user?.username || 'there'} 👋
            </h1>
            <p style={{ marginTop: 4, fontSize: 13, color: C.mid, fontWeight: 500 }}>Browse products, manage your cart and track orders.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={load} style={{ background: C.softBg, border: `1.5px solid ${C.border2}`, borderRadius: 12, padding: '9px 16px', color: C.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ↻ Refresh
            </button>
            <button onClick={() => setCartOpen(true)} style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
              border: 'none', borderRadius: 12, padding: '9px 18px',
              color: C.white, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
            }}>
              🛒 Cart
              {cartCount > 0 && (
                <span style={{ background: C.warn, color: C.white, borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {orderSuccess && (
          <div style={{ background: C.successBg, border: '1.5px solid #6EE7B7', borderRadius: 14, padding: '12px 18px', marginBottom: 18, color: '#065F46', fontSize: 13, fontWeight: 700, animation: 'popIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ Order placed successfully! The owner has been notified and will process it shortly.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F0', border: '1.5px solid #FFD0CC', borderRadius: 14, padding: '12px 18px', marginBottom: 18, color: '#CC2200', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ {error}
            <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Retry</button>
          </div>
        )}

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 22 }}>
          <StatCard label="My Orders"  value={stats.total}     icon="📦" delay={60}  accentBg={C.softBg}    />
          <StatCard label="Pending"    value={stats.pending}   icon="⏳" delay={110} accentBg={C.warnBg}    />
          <StatCard label="Shipped"    value={stats.shipped}   icon="🚚" delay={160} accentBg={C.softBg2}   />
          <StatCard label="Completed"  value={stats.completed} icon="✅" delay={210} accentBg={C.successBg} />
          <StatCard label="Cart Items" value={cartCount}       icon="🛒" delay={260} accentBg={C.softBg}    />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: C.softBg, padding: 5, borderRadius: 14, width: 'fit-content' }}>
          {[{ key: 'shop', label: '🛍️ Shop' }, { key: 'orders', label: '📋 My Orders' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: tab === t.key ? `linear-gradient(135deg, ${C.primary}, ${C.primary2})` : 'transparent',
              color: tab === t.key ? C.white : C.mid,
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
              boxShadow: tab === t.key ? '0 4px 12px rgba(124,58,237,0.25)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.primary2, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: C.light, fontWeight: 600 }}>Loading…</span>
          </div>
        ) : (
          <>
            {/* ── SHOP TAB ── */}
            {tab === 'shop' && (
              <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.light }}>🔍</span>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search products…"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 12, border: `1.5px solid ${C.border2}`, background: C.white, fontSize: 13, color: C.dark, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setCategory(cat)} style={{
                        padding: '7px 14px', borderRadius: 20, border: 'none',
                        background: category === cat ? `linear-gradient(135deg, ${C.primary}, ${C.primary2})` : C.softBg,
                        color: category === cat ? C.white : C.mid,
                        fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}>{cat}</button>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: C.light }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                    <p style={{ fontWeight: 600 }}>No products found</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {filteredProducts.map((product, i) => {
                      const inCart = cart.find(c => c.id === product.id)
                      return (
                        <div key={product.id} style={{
                          background: C.white, borderRadius: 18,
                          border: `1.5px solid ${C.border}`,
                          boxShadow: '0 2px 12px rgba(155,109,255,0.07)',
                          overflow: 'hidden',
                          animation: 'fadeUp 0.4s ease both', animationDelay: `${i * 50}ms`,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          display: 'flex', flexDirection: 'column',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.14)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 12px rgba(155,109,255,0.07)' }}
                        >
                          {/* Image */}
                          <div style={{ background: C.softBg, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, position: 'relative' }}>
                            {product.emoji}
                            {product.badge && (
                              <span style={{
                                position: 'absolute', top: 10, right: 10,
                                background: product.badge === 'New' ? C.successBg : product.badge === 'Best Seller' ? C.warnBg : C.softBg2,
                                color: product.badge === 'New' ? C.success : product.badge === 'Best Seller' ? C.warn : C.primary,
                                fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
                              }}>{product.badge}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ padding: '14px 14px 0' }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 3 }}>{product.name}</p>
                            <p style={{ fontSize: 11, color: C.mid, marginBottom: 10, lineHeight: 1.4 }}>{product.desc}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>₱{product.price}</span>
                              <span style={{ fontSize: 10, color: C.light, fontWeight: 600 }}>{product.category}</span>
                            </div>
                          </div>

                          {/* Add to Cart */}
                          <div style={{ padding: '12px 14px 14px', marginTop: 'auto' }}>
                            {inCart ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => updateQty(product.id, inCart.qty - 1)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1.5px solid ${C.border2}`, background: C.white, color: C.primary, fontWeight: 800, cursor: 'pointer', fontSize: 16 }}>−</button>
                                <span style={{ fontSize: 14, fontWeight: 800, color: C.dark, minWidth: 24, textAlign: 'center' }}>{inCart.qty}</span>
                                <button onClick={() => updateQty(product.id, inCart.qty + 1)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1.5px solid ${C.border2}`, background: C.white, color: C.primary, fontWeight: 800, cursor: 'pointer', fontSize: 16 }}>+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(product)} style={{
                                width: '100%', padding: '10px', borderRadius: 12, border: 'none',
                                background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                                color: C.white, fontWeight: 700, fontSize: 12,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 3px 10px rgba(124,58,237,0.25)',
                              }}>🛒 Add to Cart</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ORDERS TAB ── */}
            {tab === 'orders' && (
              <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>My Orders</h2>
                  <button onClick={() => setTab('shop')} style={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                    border: 'none', borderRadius: 12, padding: '9px 18px',
                    color: C.white, fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 3px 12px rgba(124,58,237,0.25)',
                  }}>+ New Order</button>
                </div>

                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', background: C.white, borderRadius: 20, border: `1.5px solid ${C.border}` }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <p style={{ color: C.light, fontWeight: 600, marginBottom: 14 }}>No orders yet</p>
                    <button onClick={() => setTab('shop')} style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`, border: 'none', borderRadius: 12, padding: '10px 22px', color: C.white, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div style={{ background: C.white, borderRadius: 20, border: `1.5px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(155,109,255,0.07)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 110px 130px 100px', padding: '10px 20px', gap: 12, background: '#FAF8FF', borderBottom: `1.5px solid ${C.border}` }}>
                      {['Order ID', 'Date', 'Total', 'Status', 'Action'].map(h => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.light, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
                      ))}
                    </div>
                    {orders.map((o, i) => (
                      <div key={o.id} style={{
                        display: 'grid', gridTemplateColumns: '100px 1fr 110px 130px 100px',
                        padding: '13px 20px', gap: 12, alignItems: 'center',
                        borderBottom: i < orders.length - 1 ? `1.5px solid #FAF8FF` : 'none',
                        animation: 'fadeUp 0.4s ease both', animationDelay: `${i * 40}ms`,
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAF8FF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>#{o.id}</span>
                        <span style={{ fontSize: 12, color: C.mid }}>{timeAgo(o.created_at)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>
                          ₱{parseFloat(o.total_amount ?? o.total_price ?? 0).toLocaleString()}
                        </span>
                        <StatusPill status={o.status} />
                        <button onClick={() => navigate(`/orders/${o.id}`)} style={{ background: C.softBg, border: `1.5px solid ${C.border2}`, borderRadius: 10, padding: '5px 12px', color: C.primary, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          View →
                        </button>
                      </div>
                    ))}
                    <div style={{ padding: '10px 20px', borderTop: `1.5px solid ${C.border}`, background: '#FAF8FF' }}>
                      <span style={{ fontSize: 12, color: C.light, fontWeight: 600 }}>
                        Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <CartSidebar
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onPlaceOrder={placeOrder}
          placing={placing}
        />
      )}
    </>
  )
}