import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { reportsApi, getToken } from '../services/api'

const NotificationContext = createContext(null)

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://besosmed-production.up.railway.app'

export function NotificationProvider({ children }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [socket, setSocket] = useState(null)

  // ─── Format Notification ──────────────────────────────────────────────────────
  const formatNotification = useCallback((type, data) => {
    const id = data._id || data.id || Math.random().toString(36).substring(7)
    const time = 'Just now'
    
    switch (type) {
      case 'new_report':
        return {
          id,
          msg: 'New report submitted',
          detail: data.reason_type || 'User reported a post',
          time,
          dot: 'bg-amber-500',
          type: 'report',
          link: '/reports',
          isRead: false
        }
      case 'new_user':
        return {
          id,
          msg: 'New user registered',
          detail: `${data.nama || 'A user'} has joined`,
          time,
          dot: 'bg-primary-500',
          type: 'user',
          link: '/user-management',
          isRead: false
        }
      case 'content_flagged':
        return {
          id,
          msg: 'Post flagged for review',
          detail: 'System detected potential violation',
          time,
          dot: 'bg-red-500',
          type: 'flag',
          link: '/reports',
          isRead: false
        }
      default:
        return { id, msg: 'New activity detected', time, dot: 'bg-slate-400', type: 'other', link: '/dashboard', isRead: false }
    }
  }, [])

  // ─── Initial Fetch (History) ──────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const data = await reportsApi.getAll('pending', 5, 0)
      const list = data.data || data.reports || []

      // Ambil unread_count langsung dari API — jangan hitung sendiri di FE
      const serverUnread = data.unread_count ?? null
      if (serverUnread !== null) {
        setUnreadCount(serverUnread)
      }

      const history = list.map(r => {
        const isSystem = r.reason_type?.includes('Sistem')
        return {
          id: r._id,
          msg: isSystem ? 'Post flagged for review' : 'New report submitted',
          detail: r.reason_text || r.reason_type,
          time: new Date(r.createdAt).toLocaleDateString('id-ID'),
          dot: isSystem ? 'bg-red-500' : 'bg-amber-500',
          type: 'report',
          link: '/reports',
          isRead: false
        }
      })
      setNotifications(history)
    } catch (err) {
      console.error('Failed to fetch notification history:', err)
    }
  }, [])

  // ─── Socket Connection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const token = getToken()
    console.log('🔌 Connecting to Socket:', BASE_URL)
    
    const newSocket = io(BASE_URL, {
      auth: { token },
      // Menghapus transports: ['websocket'] agar bisa auto-fallback ke polling jika perlu
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to Notification Socket (ID:', newSocket.id, ')')
      fetchHistory()
    })

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket Connection Error:', err.message)
    })

    // Listen for events
    newSocket.on('new_report', (data) => {
      console.log('📩 Socket Event: new_report', data)
      const notif = formatNotification('new_report', data)
      setNotifications(prev => [notif, ...prev.slice(0, 9)])
      setUnreadCount(prev => prev + 1)
    })

    newSocket.on('new_user', (data) => {
      console.log('📩 Socket Event: new_user', data)
      const notif = formatNotification('new_user', data)
      // new_user bukan laporan — tidak ubah unread_count badge
      setNotifications(prev => [notif, ...prev.slice(0, 9)])
    })

    newSocket.on('content_flagged', (data) => {
      console.log('📩 Socket Event: content_flagged', data)
      const notif = formatNotification('content_flagged', data)
      // content_flagged dihandle BE — unread_count sudah masuk di angka API
      setNotifications(prev => [notif, ...prev.slice(0, 9)])
    })

    // Catch-all notification event (jika BE mengirim event 'notification' secara umum)
    newSocket.on('notification', (data) => {
      console.log('📩 Socket Event: notification (Generic)', data)
      // Coba tebak tipenya dari data
      let type = 'other'
      if (data.type === 'report' || data.reason_type) type = 'new_report'
      if (data.type === 'user' || data.nim) type = 'new_user'
      
      const notif = formatNotification(type, data)
      setNotifications(prev => [notif, ...prev.slice(0, 9)])
      setUnreadCount(prev => prev + 1)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [isAuthenticated, formatNotification, fetchHistory])

  const clearUnread = () => setUnreadCount(0)

  // Tandai satu notif sebagai sudah dibaca (dot merah → abu-abu)
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }, [])

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id)
    clearUnread()
    if (notif.link) {
      // Untuk notif laporan → kirim highlightId agar ReportsPage bisa buka detail langsung
      const isReport = notif.type === 'report' || notif.type === 'flag'
      navigate(notif.link, { state: isReport ? { highlightId: notif.id } : {} })
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, clearUnread, handleNotificationClick, markAsRead, socket }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
