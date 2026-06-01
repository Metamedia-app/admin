// Skeleton row for loading state
function SkeletonRows({ columns, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-slate-50">
      {columns.map((col, j) => (
        <td key={col.key ?? j} className="px-4 py-4">
          <div
            className="h-4 bg-slate-100 rounded-lg animate-pulse"
            style={{ width: j === 0 ? '65%' : j === columns.length - 1 ? '80px' : '50%' }}
          />
          {j === 0 && (
            <div className="h-3 bg-slate-100 rounded-lg animate-pulse mt-1.5" style={{ width: '40%' }} />
          )}
        </td>
      ))}
    </tr>
  ))
}

export default function Table({
  columns,
  data,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'No data found.',
  emptyIcon,
  getRowClassName,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows columns={columns} rows={skeletonRows} />
          ) : !data || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  {emptyIcon ?? (
                    <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  )}
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className={`border-b border-slate-50 hover:bg-primary-50/40 transition-colors duration-100 group ${
                  getRowClassName ? getRowClassName(row) : ''
                }`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
