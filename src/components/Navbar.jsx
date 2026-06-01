import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, LogOut, ChevronDown, User, BellOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/users':     'User Management',
  '/reports':   'Reports',
  '/posts':     'Posts Management',
}

export default function Navbar({ onMenuClick }) {
  const { adminUser, logout } = useAuth()
  const { notifications, unreadCount, handleNotificationClick } = useNotifications()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const title = pageTitles[pathname] || 'Admin Panel'

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notification */}
        <div className="relative">
          <button
            onClick={() => { 
              setNotifOpen(!notifOpen)
              setDropdownOpen(false)
            }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-bold leading-none animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Notifications</p>
                {unreadCount > 0 && <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-bold">New</span>}
              </div>
              
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-slate-300">
                    <BellOff size={24} className="mb-2 opacity-20" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        handleNotificationClick(n)
                        setNotifOpen(false)
                      }}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                        n.isRead
                          ? 'hover:bg-slate-50 opacity-60'
                          : 'hover:bg-amber-50/50'
                      }`}
                    >
                      {/* Dot: warna jika belum dibaca, abu-abu jika sudah */}
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                        n.isRead ? 'bg-slate-300' : n.dot
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${
                          n.isRead ? 'text-slate-400' : 'text-slate-700'
                        }`}>{n.msg}</p>
                        <p className={`text-[11px] mt-0.5 leading-tight truncate ${
                          n.isRead ? 'text-slate-300' : 'text-slate-500'
                        }`}>{n.detail}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                      {/* Indikator belum dibaca */}
                      {!n.isRead && (
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="px-4 py-2 mt-1 border-t border-slate-50">
                <button 
                  onClick={() => { navigate('/reports'); setNotifOpen(false) }}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700 w-full text-center"
                >
                  View All Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-none">{adminUser.name}</p>
              <p className="text-xs text-slate-400 leading-none mt-0.5">
                {adminUser.nim ? `NIM: ${adminUser.nim}` : adminUser.role}
              </p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">{adminUser.name}</p>
                <p className="text-xs text-slate-400">{adminUser.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
