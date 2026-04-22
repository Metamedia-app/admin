import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

/**
 * Reusable Modal Component
 * Props:
 *   isOpen    — boolean
 *   onClose   — () => void
 *   title     — string
 *   children  — ReactNode
 *   size      — 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *   footer    — ReactNode (optional bottom section)
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const sizes = {
    sm:  'max-w-sm',
    md:  'max-w-md',
    lg:  'max-w-lg',
    xl:  'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`
          relative w-full ${sizes[size] ?? sizes.md}
          bg-white rounded-3xl shadow-2xl shadow-black/10
          border border-slate-200/60
          flex flex-col max-h-[90vh]
          animate-in fade-in zoom-in-95 duration-200
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2
            id="modal-title"
            className="font-semibold text-slate-800 text-base"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scrollbar-thin flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
