import { useState, useEffect, useCallback } from 'react'
import { Search, FileText, Trash2, Eye, RefreshCw, RotateCcw, Hash } from 'lucide-react'
import Card         from '../components/Card'
import Table        from '../components/Table'
import Button       from '../components/Button'
import Badge        from '../components/Badge'
import Modal        from '../components/Modal'
import PostPreview  from '../components/PostPreview'
import ConfirmModal from '../components/ConfirmModal'
import Pagination   from '../components/Pagination'
import { useToast } from '../context/ToastContext'
import { postsApi } from '../services/api'

// ─── Normalizer: Mendukung Repost & Original Post ─────────────────────────────
function normalizePost(p, allRawPosts = []) {
  const isTakenDown =
    p.is_taken_down === true ||
    p.isTakenDown === true ||
    p.is_deleted === true ||
    p.status === 'removed'

  // Sesuai JSON: author (bisa p.author atau p.author_id)
  const authorRaw = p.author_id || p.author || {}
  const authorName = authorRaw.nama || 'Unknown'

  // Jika ini adalah REPOST, kita harus mendapatkan data original post.
  // API bisa mengembalikan objek lengkap, atau hanya string ID.
  let isRepost = p.type === 'repost'
  let originalPostObj = p.original_post_id
  
  if (isRepost && typeof p.original_post_id === 'string') {
    // Cari original post di dalam array raw posts yang kita dapatkan
    const found = allRawPosts.find(x => (x._id || x.id) === p.original_post_id)
    if (found) {
      originalPostObj = found
    }
  }

  // Jika kita berhasil mendapatkan original post object
  const hasOriginalData = originalPostObj && typeof originalPostObj === 'object'
  const source = hasOriginalData ? originalPostObj : p
  
  // Ambil media dari source (bisa p atau original_post_id)
  const mediaArr = Array.isArray(source.media) ? source.media : []
  const image = mediaArr.length > 0 ? mediaArr[0].url : null
  
  // Caption untuk judul & konten
  const originalCaption = source.caption || ''
  const repostCaption = p.caption || ''
  
  const displayTitle = isRepost 
    ? `Repost: ${originalCaption || (hasOriginalData ? 'Tanpa Caption' : 'Data Asli Tidak Ditemukan')}` 
    : (p.caption || 'Original post')

  // Definisikan kembali originalAuthor
  const originalAuthor = hasOriginalData ? (source.author_id || source.author || {}) : null

  return {
    id:      p._id || p.id,
    title:   displayTitle,
    content: isRepost ? repostCaption : originalCaption,
    originalContent: originalCaption,
    status:  isTakenDown ? 'removed' : 'published',
    image:   image, // Media dari source (original post jika repost)
    author: {
      id:     authorRaw._id || authorRaw.id || '',
      name:   authorName,
      nim:    authorRaw.nim || '',
      avatar: authorRaw.avatar_url || null,
      initials: authorName.slice(0, 2).toUpperCase(),
    },
    originalAuthor: originalAuthor ? {
      name: originalAuthor.nama || 'Unknown',
      avatar: originalAuthor.avatar_url || null,
    } : null,
    date: p.createdAt 
      ? new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '-',
    type: p.type,
    raw: p,
  }
}

function extractArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.posts)) return data.posts
  if (data.data && Array.isArray(data.data.posts)) return data.data.posts
  return []
}

export default function PostsPage() {
  const toast = useToast()
  const [posts, setPosts]           = useState([])
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailPost, setDetailPost] = useState(null)
  const [confirmPost, setConfirmPost] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError]           = useState(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 10

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); setPage(1); }
    else setLoading(true)
    setError(null)

    try {
      const skip = (page - 1) * LIMIT
      let data;
      
      // Jika ada teks pencarian, gunakan endpoint search. Jika kosong, gunakan endpoint getAll.
      if (search.trim()) {
        data = await postsApi.search(search.trim(), LIMIT, skip)
      } else {
        data = await postsApi.getAll(LIMIT, skip)
      }
      
      const raw  = extractArray(data)
      setPosts(raw.map(p => normalizePost(p, raw)))
      setHasMore(raw.length === LIMIT)
    } catch (err) {
      setError(err.message)
      toast.error(err.message, { title: 'Gagal memuat posts' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast, page, search])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTakeDown = async () => {
    setActionLoading(true)
    try {
      await postsApi.takedown(confirmPost.id)
      setPosts(prev => prev.map(p => p.id === confirmPost.id ? { ...p, status: 'removed' } : p))
      toast.warning(`Post berhasil di-takedown.`, { title: 'Post Dinonaktifkan' })
      if (detailPost?.id === confirmPost.id) setDetailPost(null)
    } catch (err) {
      toast.error(err.message, { title: 'Takedown Gagal' })
    } finally {
      setActionLoading(false)
      setConfirmPost(null)
    }
  }

  const handleRestore = async (post) => {
    try {
      await postsApi.untakedown(post.id)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published' } : p))
      toast.success(`Post berhasil dipulihkan.`, { title: 'Post Dipulihkan' })
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Memulihkan' })
    }
  }

  const filtered = posts.filter(p => {
    const s = search.toLowerCase()
    const matchSearch =
      p.id?.toString().toLowerCase().includes(s) ||
      p.title.toLowerCase().includes(s) ||
      p.author?.name.toLowerCase().includes(s)
    
    // Logic filter gabungan: status dan type
    let matchFilter = true
    if (filter === 'published') matchFilter = p.status === 'published'
    if (filter === 'removed') matchFilter = p.status === 'removed'
    if (filter === 'original') matchFilter = p.type === 'original'
    if (filter === 'repost') matchFilter = p.type === 'repost'

    return matchSearch && matchFilter
  })

  const publishedCount = posts.filter(p => p.status === 'published').length
  const removedCount   = posts.filter(p => p.status === 'removed').length

  const columns = [
    {
      key: 'id',
      label: 'ID Post',
      render: (row) => (
        <span className="text-xs font-mono text-slate-400">#{row.id?.slice(-6) || '—'}</span>
      )
    },
    {
      key: 'title',
      label: 'Konten',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img src={row.image} className="w-10 h-10 rounded-lg object-cover bg-slate-100" alt="" />
          ) : (
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-primary-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate max-w-xs">{row.title}</p>
            <p className="text-xs text-slate-400">{row.date} · oleh {row.author?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          label={row.status === 'published' ? 'Aktif' : 'Takedown'}
          variant={row.status === 'published' ? 'published' : 'removed'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDetailPost(row)}>
            <Eye size={13} /> Detail
          </Button>
          {row.status === 'published' ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmPost(row)}>
              <Trash2 size={13} /> Takedown
            </Button>
          ) : (
            <Button variant="success" size="sm" onClick={() => handleRestore(row)}>
              <RotateCcw size={13} /> Pulihkan
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Moderasi Konten</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola dan pantau seluruh postingan di platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fetchPosts(true)} loading={refreshing}>
              <RefreshCw size={13} /> Refresh
            </Button>
          </div>
        </div>

        <Card padding={false}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-slate-100">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan ID, Judul, atau Penulis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'published', 'removed', 'original', 'repost'].map(f => {
                const labels = {
                  all: 'Semua', published: 'Aktif', removed: 'Takedown',
                  original: 'Post', repost: 'Repost'
                }
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                      filter === f ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {labels[f]}
                  </button>
                )
              })}
            </div>
          </div>

          <Table columns={columns} data={filtered} loading={loading} skeletonRows={6} emptyMessage="Tidak ada postingan." />
          
          <Pagination 
            currentPage={page} 
            hasMore={hasMore} 
            onPageChange={handlePageChange} 
            loading={loading} 
          />

          <div className="px-4 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <span>Menampilkan {filtered.length} postingan</span>
            <div className="flex gap-4">
              <span className="text-emerald-600 font-medium">● {publishedCount} Aktif</span>
              <span className="text-red-600 font-medium">● {removedCount} Takedown</span>
            </div>
          </div>
        </Card>
      </div>

      {detailPost && (
        <Modal isOpen={!!detailPost} onClose={() => setDetailPost(null)} title="Detail Postingan" size="2xl">
          <div className="px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Hash size={14} className="text-slate-400" />
                 <span className="text-xs font-mono text-slate-500">{detailPost.id}</span>
               </div>
               <Badge label={detailPost.status === 'published' ? 'Aktif' : 'Takedown'} variant={detailPost.status === 'published' ? 'published' : 'removed'} />
            </div>
            <PostPreview post={detailPost} />
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!confirmPost}
        onClose={() => setConfirmPost(null)}
        onConfirm={handleTakeDown}
        loading={actionLoading}
        variant="danger"
        title="Takedown Postingan?"
        message="Postingan ini akan disembunyikan dari publik."
        confirmLabel="Ya, Takedown"
      />
    </>
  )
}
