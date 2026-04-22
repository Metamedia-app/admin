import Modal from './Modal'
import Button from './Button'
import { AlertTriangle, ShieldOff } from 'lucide-react'

/**
 * Confirmation modal for destructive/important actions.
 * Props:
 *   isOpen        — boolean
 *   onClose       — () => void
 *   onConfirm     — () => void
 *   title         — string
 *   message       — string or ReactNode
 *   confirmLabel  — string (default: 'Confirm')
 *   cancelLabel   — string (default: 'Cancel')
 *   variant       — 'danger' | 'warning' | 'primary'
 *   loading       — boolean
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const iconStyles = {
    danger:  { bg: 'bg-red-100',    icon: <ShieldOff size={22} className="text-red-600" />   },
    warning: { bg: 'bg-amber-100',  icon: <AlertTriangle size={22} className="text-amber-600" /> },
    primary: { bg: 'bg-primary-100',icon: <AlertTriangle size={22} className="text-primary-600" /> },
  }
  const chosen = iconStyles[variant] ?? iconStyles.danger

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${chosen.bg} flex items-center justify-center`}>
          {chosen.icon}
        </div>

        {/* Text */}
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {message && (
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
