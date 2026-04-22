export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  loading = false,
}) {
  const base = `
    inline-flex items-center justify-center gap-1.5 font-medium rounded-lg
    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-60 disabled:cursor-not-allowed select-none
  `

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }

  const variants = {
    primary:
      'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm shadow-primary-200 focus:ring-primary-400',
    secondary:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm focus:ring-slate-300',
    danger:
      'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm shadow-red-200 focus:ring-red-400',
    success:
      'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm shadow-emerald-200 focus:ring-emerald-400',
    warning:
      'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm shadow-amber-200 focus:ring-amber-400',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-300',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
