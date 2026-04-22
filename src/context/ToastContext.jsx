import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null)

// ─── Toast Item Component ────────────────────────────────────────────────────
const ICONS = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  error:   { icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500'     },
  warning: { icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500'   },
  info:    { icon: Info,          color: 'text-primary-500', bg: 'bg-primary-50', border: 'border-primary-200', bar: 'bg-primary-500' },
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)
  const { icon: Icon, color, bg, border, bar } = ICONS[toast.type] ?? ICONS.info

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const handleRemove = () => {
    setVisible(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div
      className={`
        flex items-start gap-3 w-full max-w-sm px-4 py-3.5 rounded-2xl border shadow-lg shadow-slate-200/80
        transition-all duration-300 ease-in-out relative overflow-hidden
        ${bg} ${border}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {/* Icon */}
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${color}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
        )}
        <p className="text-sm text-slate-600">{toast.message}</p>
      </div>

      {/* Close */}
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-0.5 rounded-lg hover:bg-black/10 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${bar} rounded-full`}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
        }}
      />

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const duration = options.duration ?? 4000
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration, title: options.title ?? null }

    setToasts(prev => [...prev.slice(-4), toast]) // max 5 toasts
    setTimeout(() => removeToast(id), duration + 300)

    return id
  }, [removeToast])

  const toast = {
    success: (msg, opts) => addToast(msg, 'success', opts),
    error:   (msg, opts) => addToast(msg, 'error',   opts),
    warning: (msg, opts) => addToast(msg, 'warning', opts),
    info:    (msg, opts) => addToast(msg, 'info',    opts),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
