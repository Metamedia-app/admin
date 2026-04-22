const variants = {
  active:    { bg: 'bg-emerald-50  text-emerald-700  ring-1 ring-emerald-200',  dot: 'bg-emerald-500'  },
  banned:    { bg: 'bg-red-50      text-red-700      ring-1 ring-red-200',      dot: 'bg-red-500'      },
  pending:   { bg: 'bg-amber-50    text-amber-700    ring-1 ring-amber-200',    dot: 'bg-amber-500 animate-pulse'    },
  published: { bg: 'bg-primary-50  text-primary-700  ring-1 ring-primary-200',  dot: 'bg-primary-500'  },
  removed:   { bg: 'bg-slate-100   text-slate-600    ring-1 ring-slate-200',    dot: 'bg-slate-400'    },
  reviewed:  { bg: 'bg-purple-50   text-purple-700   ring-1 ring-purple-200',   dot: 'bg-purple-500'   },
  open:      { bg: 'bg-amber-50    text-amber-700    ring-1 ring-amber-200',    dot: 'bg-amber-500'    },
  in_review: { bg: 'bg-blue-50     text-blue-700     ring-1 ring-blue-200',     dot: 'bg-blue-500 animate-pulse'     },
  resolved:  { bg: 'bg-emerald-50  text-emerald-700  ring-1 ring-emerald-200',  dot: 'bg-emerald-500'  },
}

export default function Badge({ label, variant = 'active' }) {
  const style = variants[variant] ?? variants.active
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
      {label}
    </span>
  )
}
