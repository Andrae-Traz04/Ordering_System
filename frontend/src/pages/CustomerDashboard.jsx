import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchOrders, fetchProducts, createOrder } from '@/api/ordersApi'

// ── Design tokens ────────────────────────────────────────────────
const C = {
  primary:  '#0ea5e9',
  primary2: '#0284c7',
  soft:     '#f0f9ff',
  soft2:    '#e0f2fe',
  border:   '#e2e8f0',
  border2:  '#bae6fd',
  dark:     '#0f172a',
  mid:      '#64748b',
  light:    '#94a3b8',
  white:    '#ffffff',
  bg:       '#f8fafc',
  green:    '#10b981',
  greenBg:  '#ecfdf5',
  red:      '#ef4444',
  redBg:    '#fef2f2',
  amber:    '#f59e0b',
  amberBg:  '#fffbeb',
  purple:   '#8b5cf6',
  purpleBg: '#f5f3ff',
}

const STATUS = {
  pending:    { color: C.amber,   bg: C.amberBg,  label: 'Pending'    },
  processing: { color: C.primary, bg: C.soft,     label: 'Processing' },
  shipped:    { color: C.purple,  bg: C.purpleBg, label: 'Shipped'    },
  completed:  { color: C.green,   bg: C.greenBg,  label: 'Completed'  },
}

const CATEGORIES = ['All','Electronics','Beauty','Fitness','Gifts','Kitchen','Others']

// ── SVG Icons ────────────────────────────────────────────────────
const Icon = ({ d, size=16, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  shop:     ['M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z','M3 6h18','M16 10a4 4 0 01-8 0'],
  orders:   ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2','M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  cart:     ['M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z','M3 6h18','M16 10a4 4 0 01-8 0'],
  plus:     'M12 5v14M5 12h14',
  minus:    'M5 12h14',
  remove:   'M18 6L6 18M6 6l12 12',
  check:    'M20 6L9 17l-5-5',
  arrow:    'M5 12h14M12 5l7 7-7 7',
  package:  ['M16.5 9.4l-9-5.19','M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z','M3.27 6.96L12 12.01l8.73-5.05','M12 22.08V12'],
  tag:      ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z','M7 7h.01'],
}

// ── Cart Drawer ──────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onPlaceOrder, placing }) {
  const total = cart.reduce((s,i) => s + parseFloat(i.price)*i.qty, 0)

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.35)', zIndex:200, backdropFilter:'blur(2px)' }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:360, background:C.white, zIndex:201, boxShadow:'-4px 0 32px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ padding:'20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:C.soft2, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={Icons.cart} size={16} color={C.primary} />
            </div>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:C.dark }}>Your Cart</h3>
              <p style={{ fontSize:11, color:C.mid }}>{cart.length} item{cart.length!==1?'s':''}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mid, fontSize:16, fontFamily:'inherit' }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:C.soft, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <Icon d={Icons.cart} size={24} color={C.primary} />
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:C.mid }}>Your cart is empty</p>
              <p style={{ fontSize:12, color:C.light, marginTop:4 }}>Add products to get started</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid ${C.bg}` }}>
              <div style={{ width:44, height:44, borderRadius:10, background:C.soft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {item.emoji||'📦'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:C.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                <p style={{ fontSize:12, fontWeight:700, color:C.primary }}>₱{parseFloat(item.price).toFixed(2)}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <button onClick={() => onUpdateQty(item.id, item.qty-1)} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={Icons.minus} size={12} color={C.mid} />
                </button>
                <span style={{ fontSize:13, fontWeight:700, color:C.dark, minWidth:20, textAlign:'center' }}>{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, item.qty+1)} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={Icons.plus} size={12} color={C.mid} />
                </button>
                <button onClick={() => onRemove(item.id)} style={{ width:26, height:26, borderRadius:6, border:`1px solid #fecaca`, background:C.redBg, color:C.red, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2 }}>
                  <Icon d={Icons.remove} size={12} color={C.red} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding:'16px 20px', borderTop:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <span style={{ fontSize:14, fontWeight:600, color:C.mid }}>Total</span>
              <span style={{ fontSize:20, fontWeight:800, color:C.primary }}>₱{total.toFixed(2)}</span>
            </div>
            <button onClick={onPlaceOrder} disabled={placing} style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', background:placing?C.soft2:`linear-gradient(135deg, ${C.primary}, ${C.primary2})`, color:C.white, fontWeight:700, fontSize:14, cursor:placing?'wait':'pointer', fontFamily:'inherit', boxShadow:placing?'none':'0 4px 14px rgba(14,165,233,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
              {placing ? 'Placing Order...' : (
                <><Icon d={Icons.check} size={16} color={C.white} /> Place Order</>
              )}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [tab,      setTab]      = useState('shop')
  const [products, setProducts] = useState([])
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [catFilter, setCatFilter] = useState('All')
  const [cart,     setCart]     = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [placing,  setPlacing]  = useState(false)
  const [msg,      setMsg]      = useState('')

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, oRes] = await Promise.all([fetchProducts(), fetchOrders()])
      setProducts(pRes.data.products || [])
      setOrders(oRes.data.orders || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addToCart = (p) => setCart(prev => {
    const ex = prev.find(i => i.id===p.id)
    if (ex) return prev.map(i => i.id===p.id ? {...i, qty:i.qty+1} : i)
    return [...prev, {...p, qty:1}]
  })

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id!==id))
    else setCart(prev => prev.map(i => i.id===id ? {...i, qty} : i))
  }

  const placeOrder = async () => {
    if (!cart.length) return
    setPlacing(true)
    try {
      await createOrder({
        customer_name:  user.username,
        customer_email: user.email || `${user.username}@customer.com`,
        items: cart.map(i => ({ product_id:i.id, product_name:i.name, quantity:i.qty, unit_price:parseFloat(i.price) })),
      })
      setCart([]); setCartOpen(false)
      notify('Order placed successfully!')
      setTab('orders'); load()
    } catch (e) {
      const msg = e.response?.data ? Object.values(e.response.data).flat().join(', ') : 'Failed to place order.'
      notify(`Error: ${msg}`)
    } finally {
      setPlacing(false)
    }
  }

  const filtered   = catFilter==='All' ? products : products.filter(p => p.category===catFilter)
  const cartCount  = cart.reduce((s,i) => s+i.qty, 0)
  const cartTotal  = cart.reduce((s,i) => s+parseFloat(i.price)*i.qty, 0)

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Toast */}
      {msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:400, background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 18px', fontSize:13, fontWeight:600, color:C.dark, boxShadow:'0 8px 24px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:8 }}>
          <Icon d={Icons.check} size={14} color={C.green} /> {msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, animation:'fadeUp 0.4s ease both' }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Customer Portal</p>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.dark }}>Welcome, {user?.username}</h1>
          <p style={{ fontSize:13, color:C.mid, marginTop:2 }}>Browse products and track your orders</p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:C.bg, borderRadius:10, padding:3, border:`1px solid ${C.border}`, gap:3 }}>
            {[{id:'shop',icon:Icons.shop,label:'Shop'},{id:'orders',icon:Icons.orders,label:'My Orders'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background: tab===t.id?C.white:'transparent', color: tab===t.id?C.dark:C.mid, fontWeight: tab===t.id?700:500, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow: tab===t.id?'0 1px 4px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
                <Icon d={t.icon} size={13} color={tab===t.id?C.dark:C.mid} /> {t.label}
              </button>
            ))}
          </div>

          {/* Cart button */}
          <button onClick={() => setCartOpen(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:`1px solid ${cartCount>0?C.primary:C.border}`, background:cartCount>0?C.soft:C.white, color:cartCount>0?C.primary:C.mid, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
            <Icon d={Icons.shop} size={14} color={cartCount>0?C.primary:C.mid} />
            Cart
            {cartCount>0 && (
              <span style={{ background:C.primary, color:C.white, fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:20, minWidth:18, textAlign:'center' }}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'80px', color:C.light, fontSize:13, fontWeight:600 }}>Loading...</div>
      ) : (
        <>
          {/* ── SHOP TAB ── */}
          {tab === 'shop' && (
            <div style={{ animation:'fadeUp 0.35s ease both' }}>

              {/* Cart summary bar (when items in cart) */}
              {cartCount > 0 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:C.soft, border:`1px solid ${C.border2}`, borderRadius:12, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Icon d={Icons.shop} size={16} color={C.primary} />
                    <span style={{ fontSize:13, fontWeight:600, color:C.primary2 }}>
                      {cartCount} item{cartCount!==1?'s':''} in cart — <strong>₱{cartTotal.toFixed(2)}</strong>
                    </span>
                  </div>
                  <button onClick={() => setCartOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primary2})`, color:C.white, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                    View Cart <Icon d={Icons.arrow} size={12} color={C.white} />
                  </button>
                </div>
              )}

              {/* Category filter */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)} style={{
                    padding:'6px 14px', borderRadius:20,
                    border:`1px solid ${catFilter===cat?C.primary:C.border}`,
                    background: catFilter===cat?C.soft:C.white,
                    color: catFilter===cat?C.primary:C.mid,
                    fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                  }}>{cat}</button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px', background:C.white, borderRadius:16, border:`1px solid ${C.border}` }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:C.soft, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                    <Icon d={Icons.package} size={24} color={C.primary} />
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:8 }}>No products available</h3>
                  <p style={{ fontSize:13, color:C.mid }}>The store owner hasn't added any products yet. Check back soon!</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
                  {filtered.map((p, i) => {
                    const inCart = cart.find(c => c.id===p.id)
                    return (
                      <div key={p.id} style={{
                        background:C.white, borderRadius:16, border:`1px solid ${C.border}`,
                        boxShadow:'0 1px 8px rgba(0,0,0,0.04)', overflow:'hidden',
                        display:'flex', flexDirection:'column',
                        animation:'fadeUp 0.4s ease both', animationDelay:`${i*45}ms`,
                        transition:'transform 0.2s, box-shadow 0.2s',
                      }}
                        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 8px rgba(0,0,0,0.04)'}}
                      >
                        {/* Image area */}
                        <div style={{ background:C.soft, height:110, display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, position:'relative' }}>
                          {p.emoji||'📦'}
                          {p.badge && <span style={{ position:'absolute', top:8, right:8, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:C.white, color:C.primary, border:`1px solid ${C.border2}` }}>{p.badge}</span>}
                        </div>

                        {/* Info */}
                        <div style={{ padding:'12px 14px', flex:1, display:'flex', flexDirection:'column' }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:3, lineHeight:1.3 }}>{p.name}</p>
                          {p.description && <p style={{ fontSize:11, color:C.mid, marginBottom:8, lineHeight:1.4, flex:1, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.description}</p>}
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, marginTop:'auto' }}>
                            <span style={{ fontSize:17, fontWeight:800, color:C.primary }}>₱{parseFloat(p.price).toFixed(2)}</span>
                            <span style={{ fontSize:10, color:C.light, fontWeight:600 }}>{p.category}</span>
                          </div>

                          {/* Add to cart */}
                          {inCart ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <button onClick={() => updateQty(p.id, inCart.qty-1)} style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon d={Icons.minus} size={13} color={C.mid} />
                              </button>
                              <span style={{ fontSize:14, fontWeight:800, color:C.dark, minWidth:24, textAlign:'center' }}>{inCart.qty}</span>
                              <button onClick={() => updateQty(p.id, inCart.qty+1)} style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon d={Icons.plus} size={13} color={C.mid} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(p)} style={{ width:'100%', padding:'9px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primary2})`, color:C.white, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 3px 10px rgba(14,165,233,0.25)', transition:'opacity 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.opacity='0.9'}
                              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                              <Icon d={Icons.plus} size={13} color={C.white} /> Add to Cart
                            </button>
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
            <div style={{ animation:'fadeUp 0.35s ease both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:700, color:C.dark }}>My Orders</h2>
                  <p style={{ fontSize:12, color:C.mid, marginTop:2 }}>{orders.length} order{orders.length!==1?'s':''}</p>
                </div>
                <button onClick={() => setTab('shop')} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primary2})`, color:C.white, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(14,165,233,0.25)' }}>
                  <Icon d={Icons.plus} size={14} color={C.white} /> New Order
                </button>
              </div>

              {orders.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px', background:C.white, borderRadius:16, border:`1px solid ${C.border}` }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:C.soft, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                    <Icon d={Icons.orders} size={24} color={C.primary} />
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:8 }}>No orders yet</h3>
                  <p style={{ fontSize:13, color:C.mid, marginBottom:18 }}>Start shopping to place your first order</p>
                  <button onClick={() => setTab('shop')} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primary2})`, color:C.white, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    <Icon d={Icons.shop} size={14} color={C.white} /> Browse Products
                  </button>
                </div>
              ) : (
                <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 110px 130px 100px', padding:'10px 20px', gap:12, background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                    {['Order #','Date','Total','Status','Action'].map(h => (
                      <span key={h} style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
                    ))}
                  </div>
                  {orders.map((o, i) => {
                    const m = STATUS[o.status?.toLowerCase()] || STATUS.pending
                    return (
                      <div key={o.id} style={{
                        display:'grid', gridTemplateColumns:'130px 1fr 110px 130px 100px',
                        padding:'13px 20px', gap:12, alignItems:'center',
                        borderBottom: i<orders.length-1?`1px solid ${C.bg}`:'none',
                        transition:'background 0.12s',
                        animation:'fadeUp 0.4s ease both', animationDelay:`${i*35}ms`,
                      }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >
                        <span style={{ fontSize:12, fontWeight:700, color:C.primary }}>{o.order_number}</span>
                        <span style={{ fontSize:12, color:C.mid }}>{new Date(o.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>₱{parseFloat(o.total_amount||0).toFixed(2)}</span>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:m.bg, color:m.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:m.color }} />{m.label}
                        </span>
                        <button onClick={() => navigate(`/orders/${o.id}`)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primary; e.currentTarget.style.background=C.soft}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.mid; e.currentTarget.style.background=C.white}}>
                          View <Icon d={Icons.arrow} size={11} color="currentColor" />
                        </button>
                      </div>
                    )
                  })}
                  <div style={{ padding:'10px 20px', borderTop:`1px solid ${C.bg}`, background:C.bg }}>
                    <span style={{ fontSize:12, color:C.light, fontWeight:600 }}>{orders.length} order{orders.length!==1?'s':''} total</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onRemove={id=>setCart(prev=>prev.filter(i=>i.id!==id))} onPlaceOrder={placeOrder} placing={placing} />
      )}
    </>
  )
}