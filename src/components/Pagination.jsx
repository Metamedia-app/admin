import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, hasMore, onPageChange, loading }) {
  if (currentPage === 1 && !hasMore) return null

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronLeft size={16} />
        Sebelumnya
      </button>

      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md shadow-primary-200">
        {currentPage}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore || loading}
        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        Selanjutnya
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
