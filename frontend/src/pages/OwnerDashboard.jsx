import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrders, fetchSummary, updateStatus, fetchProducts, createProduct, updateProduct, deleteProduct } from '@/api/ordersApi'
import { useAuth } from '@/context/AuthContext'

// ── Design tokens ────────────────────────────────────────────────
const C = {
  primary:  '#7c3aed',
  primary2: '#6d28d9',
  soft:     '#f5f3ff',
  soft2:    '#ede9fe',
  border:   '#e5e7eb',
  border2:  '#ddd6fe',
  dark:     '#111827',
  mid:      '#6b7280',
  light:    '#9ca3af',
  white:    '#ffffff',
  bg:       '#f9fafb',
  green:    '#10b981',
  greenBg:  '#ecfdf5',
  red:      '#ef4444',
  redBg:    '#fef2f2',
  amber:    '#f59e0b',
  amberBg:  '#fffbeb',
  blue:     '#3b82f6',
  blueBg:   '#eff6ff',
}

const STATUS = {
  pending:    { color: C.amber,   bg: C.amberBg,  label: 'Pending',    next: 'processing' },
  processing: { color: C.blue,    bg: C.blueBg,   label: 'Processing', next: 'shipped'    },
  shipped:    { color: C.primary, bg: C.soft,     label: 'Shipped',    next: 'completed'  },
  completed:  { color: C.green,   bg: C.greenBg,  label: 'Completed',  next: null         },
}

const CATEGORIES = ['Electronics','Beauty','Fitness','Gifts','Kitchen','Others']
const BADGES     = ['','New','Best Seller','Popular']
const EMOJIS     = ['📦','🎁','🧴','🏋️','📷','☕','⌚','📱','💻','💄','🛒','🔧','🎮','📚','🎵']

// ── SVG Icons ────────────────────────────────────────────────────
const Icon = ({ d, size=16, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  orders:   ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2','M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  products: ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z','M7 7h.01'],
  plus:     'M12 5v14M5 12h14',
  edit:     ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:    ['M3 6h18','M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  check:    'M20 6L9 17l-5-5',
  arrow:    'M5 12h14M12 5l7 7-7 7',
  chart:    ['M18 20V10','M12 20V4','M6 20v-6'],
  eye:      ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  tag:      ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z','M7 7h.01'],
}

// ── Shared helpers ───────────────────────────────────────────────
function StatusPill({ status }) {
  const m = STATUS[status?.toLowerCase()] || STATUS.pending
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:m.bg, color:m.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color }} />
      {m.label}
    </span>
  )
}

const inp = {
  width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`,
  borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none',
  background:'#fafafa', color:C.dark, transition:'border-color 0.15s, background 0.15s',
  boxSizing:'border-box',
}

// ── Product Form Modal ───────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id
  const [form, setForm]     = useState(product || { name:'', description:'', price:'', category:'Others', emoji:'📦', badge:'', is_active:true })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.price || parseFloat(form.price) < 0) { setError('Valid price is required'); return }
    setSaving(true); setError('')
    try {
      isEdit ? await updateProduct(product.id, form) : await createProduct(form)
      onSaved(); onClose()
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(', ') : 'Failed to save product.')
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.45)', zIndex:300, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', maxWidth:520, background:C.white, borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.12)', zIndex:301, overflow:'hidden', animation:'modalIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:C.soft2, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={Icons.tag} size={18} color={C.primary} />
            </div>
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.dark }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
              <p style={{ fontSize:12, color:C.mid }}>{isEdit ? 'Update product details' : 'Create a product for your catalog'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.mid, fontSize:16, fontFamily:'inherit' }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding:'20px 24px 24px', maxHeight:'68vh', overflowY:'auto' }}>
          {error && <div style={{ padding:'10px 14px', background:C.redBg, color:C.red, borderRadius:10, fontSize:13, fontWeight:600, marginBottom:14 }}>{error}</div>}

          {/* Emoji */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>Product Icon</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {EMOJIS.map(em => (
                <button key={em} type="button" onClick={() => set('emoji', em)} style={{ width:38, height:38, borderRadius:8, border:`2px solid ${form.emoji===em ? C.primary : C.border}`, background: form.emoji===em ? C.soft : C.white, fontSize:18, cursor:'pointer', transition:'all 0.12s' }}>{em}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Product Name *</label>
            <input style={inp} placeholder="e.g. Gift Box, Smartwatch..." value={form.name} onChange={e=>set('name',e.target.value)} onFocus={e=>{e.target.style.borderColor=C.primary; e.target.style.background=C.white}} onBlur={e=>{e.target.style.borderColor=C.border; e.target.style.background='#fafafa'}} />
          </div>

          {/* Description */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Description</label>
            <textarea style={{ ...inp, resize:'vertical', minHeight:68 }} placeholder="Short description..." value={form.description} onChange={e=>set('description',e.target.value)} onFocus={e=>{e.target.style.borderColor=C.primary; e.target.style.background=C.white}} onBlur={e=>{e.target.style.borderColor=C.border; e.target.style.background='#fafafa'}} />
          </div>

          {/* Price + Category */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Price (₱) *</label>
              <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e=>set('price',e.target.value)} onFocus={e=>{e.target.style.borderColor=C.primary; e.target.style.background=C.white}} onBlur={e=>{e.target.style.borderColor=C.border; e.target.style.background='#fafafa'}} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Category</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.category} onChange={e=>set('category',e.target.value)} onFocus={e=>{e.target.style.borderColor=C.primary}} onBlur={e=>{e.target.style.borderColor=C.border}}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Badge + Active */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Badge</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.badge} onChange={e=>set('badge',e.target.value)} onFocus={e=>{e.target.style.borderColor=C.primary}} onBlur={e=>{e.target.style.borderColor=C.border}}>
                {BADGES.map(b=><option key={b} value={b}>{b||'No badge'}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:6 }}>Visibility</label>
              <button type="button" onClick={() => set('is_active', !form.is_active)} style={{ ...inp, cursor:'pointer', fontWeight:700, color: form.is_active ? C.green : C.mid, borderColor: form.is_active ? C.green : C.border, background: form.is_active ? C.greenBg : '#fafafa', display:'flex', alignItems:'center', gap:6 }}>
                <Icon d={form.is_active ? Icons.eye : Icons.eye} size={14} color={form.is_active ? C.green : C.mid} />
                {form.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div style={{ padding:'14px', background:C.bg, borderRadius:12, marginBottom:20, border:`1px solid ${C.border}` }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Preview</p>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:C.soft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, border:`1px solid ${C.border2}` }}>{form.emoji||'📦'}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:2 }}>{form.name||'Product Name'}</p>
                <p style={{ fontSize:15, fontWeight:800, color:C.primary }}>₱{parseFloat(form.price||0).toFixed(2)}</p>
              </div>
              {form.badge && <span style={{ fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:20, background:C.soft2, color:C.primary }}>{form.badge}</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background:saving?C.soft2:`linear-gradient(135deg, ${C.primary}, ${C.primary2})`, color:C.white, fontWeight:700, fontSize:13, cursor:saving?'wait':'pointer', fontFamily:'inherit', boxShadow:saving?'none':'0 4px 12px rgba(124,58,237,0.25)' }}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function DeleteProductModal({ product, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const handle = async () => {
    setDeleting(true)
    try { await deleteProduct(product.id); onDeleted(); onClose() }
    catch { setDeleting(false) }
  }
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.45)', zIndex:300, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', maxWidth:380, background:C.white, borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,0.12)', zIndex:301, padding:'28px', animation:'modalIn 0.2s ease', textAlign:'center' }}>
        <div style={{ width:52, height:52, borderRadius:14, background:C.redBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <Icon d={Icons.trash} size={22} color={C.red} />
        </div>
        <h3 style={{ fontSize:17, fontWeight:700, color:C.dark, marginBottom:8 }}>Delete Product?</h3>
        <p style={{ fontSize:13, color:C.mid, lineHeight:1.5, marginBottom:20 }}>Remove <strong style={{ color:C.dark }}>{product.name}</strong> from your catalog? This cannot be undone.</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handle} disabled={deleting} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:deleting?'#fca5a5':C.red, color:C.white, fontWeight:700, fontSize:13, cursor:deleting?'wait':'pointer', fontFamily:'inherit' }}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function OwnerDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [tab, setTab] = useState('orders')

  const [summary,   setSummary]   = useState(null)
  const [orders,    setOrders]    = useState([])
  const [products,  setProducts]  = useState([])
  const [ordLoading, setOrdLoad]  = useState(true)
  const [prdLoading, setPrdLoad]  = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId,   setUpdatingId]   = useState(null)
  const [error,     setError]     = useState('')
  const [toast,     setToast]     = useState('')

  const [addModal,  setAddModal]  = useState(false)
  const [editPrd,   setEditPrd]   = useState(null)
  const [delPrd,    setDelPrd]    = useState(null)

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadOrders = useCallback(() => {
    setOrdLoad(true); setError('')
    Promise.all([fetchSummary(), fetchOrders()])
      .then(([s, o]) => { setSummary(s.data); setOrders(o.data.orders || []) })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setOrdLoad(false))
  }, [])

  const loadProducts = useCallback(() => {
    setPrdLoad(true)
    fetchProducts().then(r => setProducts(r.data.products || [])).catch(()=>{}).finally(() => setPrdLoad(false))
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { if (tab === 'products') loadProducts() }, [tab, loadProducts])

  const handleAdvance = async (orderId, currentStatus) => {
    const next = STATUS[currentStatus]?.next
    if (!next) return
    setUpdatingId(orderId)
    try { await updateStatus(orderId, next, `Advanced to ${next}`); loadOrders() }
    catch (e) { setError(e.response?.data?.detail || 'Failed to update.') }
    finally { setUpdatingId(null) }
  }

  const displayed = statusFilter ? orders.filter(o=>o.status===statusFilter) : orders

  const greeting = (() => { const h = new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening' })()

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:translate(-50%,-48%) scale(0.96)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:400, background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 18px', fontSize:13, fontWeight:600, color:C.dark, boxShadow:'0 8px 24px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:8 }}>
          <Icon d={Icons.check} size={14} color={C.green} /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, animation:'fadeUp 0.4s ease both' }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Owner Dashboard</p>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.dark }}>{greeting}, {user?.username}</h1>
          <p style={{ fontSize:13, color:C.mid, marginTop:2 }}>Manage your store and process orders</p>
        </div>
        <button onClick={loadOrders} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          <Icon d={Icons.refresh} size={14} color={C.mid} /> Refresh
        </button>
      </div>

      {error && <div style={{ padding:'12px 16px', background:C.redBg, color:C.red, borderRadius:12, marginBottom:20, fontSize:13, fontWeight:600 }}>{error}</div>}

      {/* Stats */}
      {summary && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:22, animation:'fadeUp 0.4s ease both', animationDelay:'60ms' }}>
          {[
            { label:'Total Orders',  value: summary.total_orders,               accent:'#3b82f6' },
            { label:'Pending',       value: summary.by_status?.pending||0,       accent:C.amber   },
            { label:'Processing',    value: summary.by_status?.processing||0,    accent:C.blue    },
            { label:'Completed',     value: summary.by_status?.completed||0,     accent:C.green   },
            { label:'Revenue',       value:`₱${parseFloat(summary.total_revenue||0).toFixed(0)}`, accent:C.primary, isText:true },
          ].map((s,i) => (
            <div key={s.label} style={{ background:C.white, borderRadius:14, padding:'16px', border:`1px solid ${C.border}`, boxShadow:'0 1px 6px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden', animation:'fadeUp 0.4s ease both', animationDelay:`${i*50}ms` }}>
              <div style={{ position:'absolute', top:0, right:0, width:48, height:48, background:s.accent, borderRadius:'0 14px 0 48px', opacity:0.12 }} />
              <p style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.label}</p>
              <p style={{ fontSize: s.isText?18:26, fontWeight:800, color:C.dark, lineHeight:1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, animation:'fadeUp 0.4s ease both', animationDelay:'120ms' }}>
        {[
          { id:'orders',   icon:Icons.orders,   label:'Orders'      },
          { id:'products', icon:Icons.products, label:'My Products' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:`1px solid ${tab===t.id ? C.primary : C.border}`,
            background: tab===t.id ? C.soft : C.white,
            color: tab===t.id ? C.primary : C.mid,
            fontWeight: tab===t.id ? 700 : 500, fontSize:13,
            cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
          }}>
            <Icon d={t.icon} size={14} color={tab===t.id ? C.primary : C.mid} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div style={{ animation:'fadeUp 0.35s ease both' }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {['', ...Object.keys(STATUS)].map(s => {
              const m = s ? STATUS[s] : null
              return (
                <button key={s||'all'} onClick={() => setStatusFilter(s)} style={{
                  padding:'6px 14px', borderRadius:20,
                  border:`1px solid ${statusFilter===s ? (s?m.color:C.dark) : C.border}`,
                  background: statusFilter===s ? (s?m.bg:C.dark) : C.white,
                  color: statusFilter===s ? (s?m.color:C.white) : C.mid,
                  fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}>
                  {s ? STATUS[s].label : 'All'}
                  <span style={{ marginLeft:5, fontSize:11, opacity:0.7 }}>({s ? orders.filter(o=>o.status===s).length : orders.length})</span>
                </button>
              )
            })}
          </div>

          {ordLoading ? (
            <div style={{ textAlign:'center', padding:'60px', color:C.light, fontSize:13, fontWeight:600 }}>Loading orders...</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', background:C.white, borderRadius:16, border:`1px solid ${C.border}`, color:C.light, fontSize:13, fontWeight:600 }}>No orders found</div>
          ) : (
            <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 80px 100px 110px 120px', padding:'10px 20px', gap:12, background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                {['Order #','Customer','Items','Total','Status','Action'].map(h => (
                  <span key={h} style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
                ))}
              </div>
              {displayed.map((o, i) => {
                const m = STATUS[o.status] || STATUS.pending
                const next = m.next
                return (
                  <div key={o.id} style={{
                    display:'grid', gridTemplateColumns:'130px 1fr 80px 100px 110px 120px',
                    padding:'13px 20px', gap:12, alignItems:'center',
                    borderBottom: i<displayed.length-1 ? `1px solid ${C.bg}` : 'none',
                    cursor:'pointer', transition:'background 0.12s',
                    animation:'fadeUp 0.4s ease both', animationDelay:`${i*35}ms`,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    <span style={{ fontSize:12, fontWeight:700, color:C.primary }}>{o.order_number}</span>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:C.dark }}>{o.customer_name||'—'}</p>
                      <p style={{ fontSize:11, color:C.light }}>{o.customer_email||''}</p>
                    </div>
                    <span style={{ fontSize:13, color:C.mid }}>{o.item_count}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>₱{parseFloat(o.total_amount||0).toFixed(2)}</span>
                    <StatusPill status={o.status} />
                    <div onClick={e=>e.stopPropagation()}>
                      {next ? (
                        <button onClick={() => handleAdvance(o.id, o.status)} disabled={updatingId===o.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1px solid ${STATUS[next].color}`, background:STATUS[next].bg, color:STATUS[next].color, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', opacity:updatingId===o.id?0.6:1, transition:'all 0.15s', whiteSpace:'nowrap' }}>
                          <Icon d={Icons.arrow} size={11} color={STATUS[next].color} />
                          {updatingId===o.id ? '...' : STATUS[next].label}
                        </button>
                      ) : (
                        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.green, fontWeight:600 }}>
                          <Icon d={Icons.check} size={12} color={C.green} /> Done
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              <div style={{ padding:'10px 20px', borderTop:`1px solid ${C.bg}`, background:C.bg, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:C.light, fontWeight:600 }}>Showing {displayed.length} of {orders.length} orders</span>
                <button onClick={() => navigate('/orders')} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 12px', color:C.mid, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  View Details <Icon d={Icons.arrow} size={12} color={C.mid} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {tab === 'products' && (
        <div style={{ animation:'fadeUp 0.35s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:C.dark }}>Product Catalog</h2>
              <p style={{ fontSize:12, color:C.mid, marginTop:2 }}>{products.length} product{products.length!==1?'s':''} in your store</p>
            </div>
            <button onClick={() => setAddModal(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:10, border:'none', background:`linear-gradient(135deg, ${C.primary}, ${C.primary2})`, color:C.white, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(124,58,237,0.25)' }}>
              <Icon d={Icons.plus} size={14} color={C.white} /> Add Product
            </button>
          </div>

          {prdLoading ? (
            <div style={{ textAlign:'center', padding:'60px', color:C.light, fontSize:13, fontWeight:600 }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', background:C.white, borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ width:52, height:52, borderRadius:14, background:C.soft, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Icon d={Icons.tag} size={24} color={C.primary} />
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:8 }}>No products yet</h3>
              <p style={{ fontSize:13, color:C.mid, marginBottom:18 }}>Add your first product so customers can browse and order</p>
              <button onClick={() => setAddModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:10, border:'none', background:`linear-gradient(135deg, ${C.primary}, ${C.primary2})`, color:C.white, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(124,58,237,0.2)' }}>
                <Icon d={Icons.plus} size={14} color={C.white} /> Add First Product
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:14 }}>
              {products.map((p, i) => (
                <div key={p.id} style={{
                  background:C.white, borderRadius:16,
                  border:`1px solid ${p.is_active ? C.border : '#fecaca'}`,
                  boxShadow:'0 1px 8px rgba(0,0,0,0.04)',
                  overflow:'hidden', opacity: p.is_active?1:0.65,
                  animation:'fadeUp 0.4s ease both', animationDelay:`${i*45}ms`,
                  transition:'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 8px rgba(0,0,0,0.04)'}}
                >
                  {/* Card top */}
                  <div style={{ background:C.soft, height:100, display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, position:'relative' }}>
                    {p.emoji||'📦'}
                    {p.badge && <span style={{ position:'absolute', top:8, right:8, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:C.white, color:C.primary, border:`1px solid ${C.border2}` }}>{p.badge}</span>}
                    {!p.is_active && <span style={{ position:'absolute', top:8, left:8, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:C.redBg, color:C.red }}>Inactive</span>}
                  </div>

                  {/* Card body */}
                  <div style={{ padding:'14px 14px 12px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:3 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.dark, flex:1, marginRight:6, lineHeight:1.3 }}>{p.name}</p>
                      <span style={{ fontSize:10, color:C.light, fontWeight:600, whiteSpace:'nowrap' }}>{p.category}</span>
                    </div>
                    {p.description && <p style={{ fontSize:11, color:C.mid, marginBottom:8, lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.description}</p>}
                    <p style={{ fontSize:17, fontWeight:800, color:C.primary, marginBottom:12 }}>₱{parseFloat(p.price).toFixed(2)}</p>

                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => setEditPrd(p)} style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.mid, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primary; e.currentTarget.style.background=C.soft}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.mid; e.currentTarget.style.background=C.white}}>
                        <Icon d={Icons.edit} size={12} color="currentColor" /> Edit
                      </button>
                      <button onClick={() => setDelPrd(p)} style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid #fecaca`, background:C.redBg, color:C.red, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.red; e.currentTarget.style.color=C.white; e.currentTarget.style.borderColor=C.red}}
                        onMouseLeave={e=>{e.currentTarget.style.background=C.redBg; e.currentTarget.style.color=C.red; e.currentTarget.style.borderColor='#fecaca'}}>
                        <Icon d={Icons.trash} size={12} color="currentColor" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {addModal  && <ProductModal product={null} onClose={() => setAddModal(false)}  onSaved={() => { loadProducts(); notify('Product added!') }} />}
      {editPrd   && <ProductModal product={editPrd} onClose={() => setEditPrd(null)} onSaved={() => { loadProducts(); notify('Product updated!') }} />}
      {delPrd    && <DeleteProductModal product={delPrd} onClose={() => setDelPrd(null)} onDeleted={() => { loadProducts(); notify('Product deleted.') }} />}
    </>
  )
}