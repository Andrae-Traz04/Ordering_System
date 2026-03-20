import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications } from '@/api/ordersApi'
import { IconBell, IconPackage, IconCheckCircle, IconEmpty } from '@/components/IconLibrary'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('readNotifications')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const dropdownRef = useRef(null)
  const loadTimeoutRef = useRef(null)

  // Memoized unread count
  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.includes(n.id)).length,
    [notifications, readIds]
  )

  // Memoized notification icons
  const notificationIcons = useMemo(() => ({
    'new_order': <IconPackage color="#EA580C" size={18} strokeWidth={2} />,
    'order_completed': <IconCheckCircle color="#10B981" size={18} strokeWidth={2} />,
    'default': <IconPackage color="#7C3AED" size={18} strokeWidth={2} />
  }), [])

  const getNotificationIcon = useCallback((type) => {
    return notificationIcons[type] || notificationIcons['default']
  }, [notificationIcons])

  const formatTime = useCallback((str) => {
    const diff = Math.floor((Date.now() - new Date(str)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(str).toLocaleDateString()
  }, [])

  const load = useCallback(() => {
    fetchNotifications()
      .then(r => {
        if (r.data?.notifications) {
          setNotifications(r.data.notifications)
        }
      })
      .catch(() => {})
  }, [])

  // Load notifications on mount and window focus
  useEffect(() => {
    load()
    
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    }
  }, [load])

  // Handle outside click
  useEffect(() => {
    if (!open) return

    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const updateReadStatus = useCallback((notificationId) => {
    setReadIds(prev => {
      if (prev.includes(notificationId)) return prev
      const updated = [...prev, notificationId]
      localStorage.setItem('readNotifications', JSON.stringify(updated))
      return updated
    })
  }, [])

  const markAllRead = useCallback(() => {
    const allIds = notifications.map(n => n.id)
    localStorage.setItem('readNotifications', JSON.stringify(allIds))
    setReadIds(allIds)
  }, [notifications])

  const handleNotificationClick = useCallback((n) => {
    updateReadStatus(n.id)
    setOpen(false)
    navigate(`/orders/${n.order_id}`)
  }, [updateReadStatus, navigate])

  const handleBellClick = useCallback(() => {
    setOpen(prev => !prev)
    if (!open) load()
  }, [open, load])

  return (
    <div className="notification-container" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="notification-bell-btn"
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <IconBell size={20} color="#2D1F6E" />
        {unreadCount > 0 && (
          <div className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <div className="notification-header-left">
              <span className="notification-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notification-unread-badge">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="notification-clear-btn">
                Mark all read
              </button>
            )}
          </div>

          {/* List - shows history or empty state only if completely cleared */}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <IconEmpty size={40} color="#9B8FC0" />
                </div>
                <div className="notification-empty-text">No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => {
                const isRead = readIds.includes(n.id)
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`notification-item${isRead ? '' : ' unread'}`}
                  >
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{n.message}</div>
                      <div className="notification-time">{formatTime(n.created_at)}</div>
                    </div>
                    {!isRead && <div className="notification-dot" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}