import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertCircle, Eye, CheckCircle, Search, Filter, RefreshCw, User, MessageSquare } from 'lucide-react'
import Card         from '../components/Card'
import Table        from '../components/Table'
import Button       from '../components/Button'
import Badge        from '../components/Badge'
import Modal        from '../components/Modal'
import PostPreview  from '../components/PostPreview'
import Pagination   from '../components/Pagination'
import { useToast } from '../context/ToastContext'
import { reportsApi, postsApi } from '../services/api'

// ─── Normalizer Report ──────────────────────────────────────────────────────
function normalizeReport(r) {
  const reporter = r.reporter_id || {}
  const post     = r.post_id || null
  const postAuthor = post?.author_id || {}
  const isSystem = r.reason_type?.includes('Sistem')

  return {
    id:         r._id,
    type:       r.reason_type || 'Laporan Umum',
    reason:     r.reason_text || '-',
    status:     r.status || 'pending',
    isSystem,
    date:       new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    fullDate:   new Date(r.createdAt).toLocaleString('id-ID'),
    reporter: {
      name:     reporter.nama || 'Anonymous',
      nim:      reporter.nim || '-',
      avatar:   reporter.avatar_url,
      initials: (reporter.nama || 'AN').slice(0, 2).toUpperCase()
    },
    // Objek post yang sudah siap untuk PostPreview
    postData: post ? {
      id:       post._id,
      title:    post.caption || 'Postingan',
      content:  post.caption || '',
      image:    (post.media && post.media.length > 0) ? post.media[0].url : null,
      date:     post.createdAt ? new Date(post.createdAt).toLocaleDateString('id-ID') : '-',
      author: {
        name:   postAuthor.nama || 'Unknown',
        nim:    postAuthor.nim || '-',
        avatar: postAuthor.avatar_url,
        initials: (postAuthor.nama || 'UN').slice(0, 2).toUpperCase()
      },
      raw:      post
    } : null,
    raw: r
  }
}

function extractArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.data?.reports)) return data.data.reports
  if (Array.isArray(data.reports)) return data.reports
  return []
}

export default function ReportsPage() {
  const toast = useToast()
  const location = useLocation()
  // ID laporan yang diklik dari notif — untuk buka modal langsung
  const highlightId = location.state?.highlightId ?? null
  const highlightHandled = useRef(false)

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]   = useState('pending')
  const [selectedReport, setSelectedReport] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 10

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); setPage(1); }
    else setLoading(true)
    
    try {
      const skip = (page - 1) * LIMIT
      const data = await reportsApi.getAll(filter, LIMIT, skip)
      const raw  = extractArray(data)
      setReports(raw.map(normalizeReport))
      setHasMore(raw.length === LIMIT)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat laporan' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter, page, toast])

  useEffect(() => { fetchReports() }, [fetchReports])

  // ─── Jika datang dari klik notif, atur filter & cari laporan ─────────────────
  useEffect(() => {
    if (highlightId && !highlightHandled.current) {
      // Reset agar bisa scan dari page 1 dengan filter all
      highlightHandled.current = false
      setFilter('all')
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId])

  // Setelah data load, cari laporan berdasarkan highlightId
  useEffect(() => {
    if (!highlightId || loading || highlightHandled.current || reports.length === 0) return
    const found = reports.find(r => r.id === highlightId)
    if (found) {
      setSelectedReport(found)
      highlightHandled.current = true
    } else if (hasMore && page < 10) {
      // Belum ketemu, coba halaman berikutnya (max 10 halaman)
      setPage(prev => prev + 1)
    } else {
      // Tidak ditemukan di semua halaman
      highlightHandled.current = true
      toast.info('Laporan tidak ditemukan di halaman ini.', { title: 'Info' })
    }
  }, [highlightId, reports, loading, hasMore, page, toast])

  const handleTakedown = async (reportId, postId) => {
    try {
      setRefreshing(true)
      // 1. Takedown Postingan
      await postsApi.takedown(postId)
      // 2. Update Status Laporan menjadi 'resolved'
      await reportsApi.updateStatus(reportId, 'resolved')
      
      toast.warning('Postingan berhasil di-takedown dan laporan selesai.', { title: 'Takedown & Resolved' })
      fetchReports() // Refresh list
      setSelectedReport(null)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Memproses Laporan' })
    } finally {
      setRefreshing(false)
    }
  }

  const handleIgnore = async (reportId) => {
    try {
      setRefreshing(true)
      // Update Status Laporan menjadi 'ignored'
      await reportsApi.updateStatus(reportId, 'ignored')
      
      toast.info('Laporan telah diabaikan.', { title: 'Report Ignored' })
      fetchReports() // Refresh list
      setSelectedReport(null)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Mengabaikan Laporan' })
    } finally {
      setRefreshing(false)
    }
  }

  const columns = [
    {
      key: 'type',
      label: 'Tipe Laporan',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${row.isSystem ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-800">{row.type}</p>
              {row.isSystem && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Auto</span>
              )}
            </div>
            <p className="text-xs text-slate-400">{row.date}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'reporter',
      label: 'Pelapor',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
             {row.reporter.avatar ? (
               <img src={row.reporter.avatar} className="w-full h-full object-cover" alt="" />
             ) : <span className="text-[10px] font-bold text-slate-400">{row.reporter.initials}</span>}
          </div>
          <span className="text-sm font-medium text-slate-600">{row.reporter.name}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Alasan',
      render: (row) => (
        <p className="text-sm text-slate-500 truncate max-w-[200px]">{row.reason}</p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge 
          label={row.status.toUpperCase()} 
          variant={row.status === 'pending' ? 'pending' : row.status === 'resolved' ? 'success' : 'warning'} 
        />
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <Button variant="primary" size="sm" onClick={() => setSelectedReport(row)}>
          <Eye size={14} /> Review
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan Konten</h2>
          <p className="text-sm text-slate-500 mt-1">Review dan moderasi postingan yang dilaporkan user</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fetchReports(true)} loading={refreshing}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
          {['pending', 'resolved', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === s ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Table 
          columns={columns} 
          data={reports} 
          loading={loading} 
          skeletonRows={5} 
          emptyMessage="Tidak ada laporan masuk."
          getRowClassName={(row) =>
            row.id === highlightId
              ? 'bg-amber-50 ring-1 ring-amber-300 ring-inset'
              : ''
          }
        />
        
        <Pagination currentPage={page} hasMore={hasMore} onPageChange={setPage} loading={loading} />
      </Card>

      {/* Detail Modal */}
      {selectedReport && (
        <Modal 
          isOpen={!!selectedReport} 
          onClose={() => setSelectedReport(null)} 
          title="Review Laporan"
          size="3xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
            {/* Left: Report Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Informasi Laporan</h4>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tipe</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${selectedReport.isSystem ? 'text-red-600' : 'text-amber-600'}`}>
                        {selectedReport.type}
                      </p>
                      {selectedReport.isSystem && <Badge label="SYSTEM DETECTED" variant="removed" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Detail Laporan</p>
                    <p className={`text-sm p-3 rounded-xl border mt-1 shadow-sm ${
                      selectedReport.isSystem 
                        ? 'bg-red-50 text-red-700 border-red-100 font-medium' 
                        : 'bg-white text-slate-700 border-slate-100'
                    }`}>
                      {selectedReport.isSystem ? (
                        <span className="flex items-start gap-2">
                          <MessageSquare size={14} className="mt-1 flex-shrink-0" />
                          {selectedReport.reason}
                        </span>
                      ) : `"${selectedReport.reason}"`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                      {selectedReport.reporter.avatar ? (
                        <img src={selectedReport.reporter.avatar} className="w-full h-full object-cover" alt="" />
                      ) : <User size={20} className="text-slate-300" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pelapor</p>
                      <p className="text-xs font-bold text-slate-700">{selectedReport.reporter.name}</p>
                      <p className="text-[10px] text-slate-400">NIM: {selectedReport.reporter.nim}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {selectedReport.status === 'pending' ? (
                  <>
                    <Button 
                      variant="danger" 
                      className="w-full py-3"
                      onClick={() => handleTakedown(selectedReport.id, selectedReport.postData.id)}
                      loading={refreshing}
                    >
                      Takedown Postingan
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => handleIgnore(selectedReport.id)}
                      loading={refreshing}
                    >
                      Abaikan Laporan
                    </Button>
                  </>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle size={20} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Laporan Selesai</p>
                      <p className="text-[10px] font-medium opacity-80">Laporan ini telah ditangani dengan status: {selectedReport.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Post Preview */}
            <div className="lg:col-span-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Konten yang Dilaporkan</h4>
              {selectedReport.postData ? (
                <PostPreview post={selectedReport.postData} />
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <AlertCircle size={32} />
                  </div>
                  <h5 className="text-slate-800 font-bold mb-1">Postingan Tidak Ditemukan</h5>
                  <p className="text-slate-500 text-sm">Konten ini mungkin sudah dihapus atau tidak dapat diakses.</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
