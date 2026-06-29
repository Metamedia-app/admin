import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileWarning,
  FileText,
  X,
  ShieldCheck,
  BookOpen,
  MessagesSquare,
  UserCog,
  GraduationCap,
} from 'lucide-react'

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/reports', icon: FileWarning, label: 'Reports' },
  { to: '/posts', icon: FileText, label: 'Posts' },
]

const adminNavItems = [
  { to: '/user-management', icon: UserCog, label: 'Manajemen User' },
  { to: '/majors', icon: GraduationCap, label: 'Program Studi' },
]

const matkulNavItems = [
  { to: '/subjects', icon: BookOpen, label: 'Mata Kuliah' },
  { to: '/groups', icon: MessagesSquare, label: 'Grup Kuliah' },
  { to: '/group-reports', icon: FileText, label: 'Laporan Tugas' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-[#0f172a] flex flex-col
        shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">AdminPanel</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-80">
          Main Menu
        </p>
        <div className="space-y-1">
          {mainNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                 ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${isActive ? 'text-white' : 'text-slate-500'}`}>
                    <Icon size={18} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 mt-8 opacity-80">
          Admin
        </p>
        <div className="space-y-1">
          {adminNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                 ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${isActive ? 'text-white' : 'text-slate-500'}`}>
                    <Icon size={18} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 mt-8 opacity-80">
          Grup &amp; Matkul
        </p>
        <div className="space-y-1">
          {matkulNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                 ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${isActive ? 'text-white' : 'text-slate-500'}`}>
                    <Icon size={18} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[11px] font-medium text-slate-500">System Operational</span>
        </div>
      </div>
    </aside>
  )
}
