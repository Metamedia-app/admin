export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-slate-100 shadow-sm
        ${padding ? 'p-5 sm:p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
