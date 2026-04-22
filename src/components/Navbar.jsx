import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, LogOut, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/users':     'User Management',
  '/reports':   'Reports',
  '/posts':     'Posts Management',
}

export default function Navbar({ onMenuClick }) {
  const { adminUser, logout } = useAuth()
  const { pathname } = useLocation()
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
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false) }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">Notifications</p>
              {[
                { msg: 'New user registered', time: '2 min ago', dot: 'bg-primary-500' },
                { msg: 'New report submitted', time: '15 min ago', dot: 'bg-amber-500' },
                { msg: 'Post flagged for review', time: '1 hr ago', dot: 'bg-red-500' },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">{n.msg}</p>
                    <p className="text-xs text-slate-400">{n.time}</p>
                  </div>
                </div>
              ))}
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
