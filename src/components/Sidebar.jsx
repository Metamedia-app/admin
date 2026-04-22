import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileWarning,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users',     icon: Users,           label: 'Users' },
  { to: '/reports',   icon: FileWarning,     label: 'Reports' },
  { to: '/posts',     icon: FileText,        label: 'Posts' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-slate-100 flex flex-col
        shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md shadow-primary-200">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">AdminPanel</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Main Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-primary-50 text-primary-700 border border-primary-100 shadow-sm'
                 : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                  <Icon size={18} />
                </span>
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-100" />
          <span className="text-xs text-slate-400">All systems operational</span>
        </div>
      </div>
    </aside>
  )
}
