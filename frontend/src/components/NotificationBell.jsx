import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications } from '@/api/ordersApi'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('readNotifications')
    return saved ? JSON.parse(saved) : []
  })
  const dropdownRef = useRef(null)

  const load = () => {
    fetchNotifications()
      .then(r => setNotifications(r.data.notifications))
      .catch(() => {})
  }

  useEffect(() => {
    load()
    // Reload when tab regains focus
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    localStorage.setItem('readNotifications', JSON.stringify(allIds))
    setReadIds(allIds)
  }

  const handleClick = (n) => {
    const updated = [...readIds, n.id]
    localStorage.setItem('readNotifications', JSON.stringify(updated))
    setReadIds(updated)
    setOpen(false)
    navigate(`/orders/${n.order_id}`)
  }

  const formatTime = (str) => {
    const diff = Math.floor((Date.now() - new Date(str)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(str).toLocaleDateString()
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          padding: '4px 8px',
          borderRadius: 8,
          transition: 'background 0.15s',
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#ef4444',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: 8,
          width: 340,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          border: '1px solid #e8e8f0',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Notifications{' '}
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  marginLeft: 4,
                }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 11,
                  color: '#6c63ff',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0
              ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#aaa',
                  fontSize: 13,
                }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>🔕</div>
                  No notifications yet
                </div>
              )
              : notifications.map(n => {
                  const isRead = readIds.includes(n.id)
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f5f5fa',
                        cursor: 'pointer',
                        background: isRead ? '#fff' : '#f5f5ff',
                        transition: 'background 0.15s',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: 18, marginTop: 2 }}>
                        {n.type === 'new_order' ? '📦' : '✅'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 13,
                          color: '#1a1a2e',
                          fontWeight: isRead ? 400 : 600,
                          lineHeight: 1.4,
                        }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                          {formatTime(n.created_at)}
                        </div>
                      </div>
                      {!isRead && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#6c63ff',
                          marginTop: 5,
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                  )
                })
            }
          </div>
        </div>
      )}
    </div>
  )
}