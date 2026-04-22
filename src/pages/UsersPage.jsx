import { useState, useEffect, useRef } from 'react'
import { Search, UserX, UserCheck, Users, AlertTriangle, Shield, SearchX } from 'lucide-react'
import Card         from '../components/Card'
import Table        from '../components/Table'
import Button       from '../components/Button'
import Badge        from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import Pagination   from '../components/Pagination'
import { useToast } from '../context/ToastContext'
import { usersApi } from '../services/api'

// ─── Normalizer ────────────────────────────────────────────────────────────────
function normalizeUser(u) {
  const isBanned =
    u.is_banned === true ||
    u.isBanned === true ||
    u.status === 'banned' ||
    u.status === 'blocked'

  const name = u.nama || u.name || u.full_name || u.username || 'Unknown'

  return {
    id:          u.id || u._id,
    name,
    nim:         u.nim || u.username || '-',
    email:       u.email ?? '-',
    avatar:      name.slice(0, 2).toUpperCase(),
    status:      isBanned ? 'banned' : 'active',
    role:        u.role ?? 'User',
    reportCount: u.report_count ?? u.reportCount ?? 0,
    joined:      u.created_at
      ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : u.createdAt
        ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : u.joined ?? '-',
    raw: u,
  }
}

function extractArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  
  // Cek data.data, data.users, data.items
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.users)) return data.users
  if (Array.isArray(data.items)) return data.items

  // Cek data.data.users (nesting lebih dalam)
  if (data.data && Array.isArray(data.data.users)) return data.data.users
  if (data.data && Array.isArray(data.data.data)) return data.data.data

  return []
}

// ─── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers]         = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError]         = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 10

  const debouncedSearch = useDebounce(search, 500)

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      setHasSearched(!!debouncedSearch.trim())
      try {
        const skip = (page - 1) * LIMIT
        // Jika pencarian kosong, kirim q sebagai string kosong atau sesuai curl Anda
        const data = await usersApi.search(debouncedSearch.trim(), LIMIT, skip)
        const raw  = extractArray(data)
        
        setUsers(raw.map(normalizeUser))
        setHasMore(raw.length === LIMIT)
      } catch (err) {
        setError(err.message)
        toast.error(err.message, { title: 'Gagal memuat user' })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [debouncedSearch, page, toast])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Ban ─────────────────────────────────────────────────────────────────────
  const openConfirm = (user, action) => setConfirm({ user, action })
  const closeConfirm = () => { setConfirm(null); setActionLoading(false) }

  const handleConfirm = async () => {
    if (!confirm) return
    setActionLoading(true)
    const { user, action } = confirm
    try {
      if (action === 'ban') {
        await usersApi.ban(user.id)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'banned' } : u))
        toast.warning(`${user.name} telah dibanned.`, { title: 'User Dibanned' })
      } else {
        await usersApi.unban(user.id)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'active' } : u))
        toast.success(`${user.name} telah di-unban.`, { title: 'User Diaktifkan' })
      }
    } catch (err) {
      toast.error(err.message, { title: 'Aksi Gagal' })
    } finally {
      closeConfirm()
    }
  }

  const activeCount = users.filter(u => u.status === 'active').length
  const bannedCount = users.filter(u => u.status === 'banned').length

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {row.avatar}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-400">
              NIM: {row.nim}
              {row.email && row.email !== '-' ? ` · ${row.email}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
          row.role === 'Moderator' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      key: 'joined',
      label: 'Bergabung',
      render: (row) => <span className="text-slate-500 text-sm">{row.joined}</span>,
    },
    {
      key: 'reportCount',
      label: 'Laporan',
      render: (row) =>
        row.reportCount > 0 ? (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${
            row.reportCount >= 5 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}>
            <AlertTriangle size={11} /> {row.reportCount}
          </span>
        ) : <span className="text-xs text-slate-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          label={row.status === 'active' ? 'Aktif' : 'Dibanned'}
          variant={row.status === 'active' ? 'active' : 'banned'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) =>
        row.status === 'banned' ? (
          <Button variant="success" size="sm" onClick={() => openConfirm(row, 'unban')}>
            <UserCheck size={13} /> Unban
          </Button>
        ) : (
          <Button variant="danger" size="sm" onClick={() => openConfirm(row, 'ban')}>
            <UserX size={13} /> Ban
          </Button>
        ),
    },
  ]

  // ─── Empty state berdasarkan kondisi ──────────────────────────────────────
  const renderEmptyState = () => {
    if (!hasSearched) return null // ditangani di bawah (prompt state)
    if (error) return null
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
        <SearchX size={36} className="opacity-40" />
        <p className="text-sm font-medium">Tidak ada user ditemukan untuk "{debouncedSearch}"</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manajemen User</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Cari dan kelola akun pengguna platform
            </p>
          </div>
          {hasSearched && users.length > 0 && (
            <div className="flex gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Users size={13} /> {activeCount} Aktif
              </span>
              <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <UserX size={13} /> {bannedCount} Dibanned
              </span>
            </div>
          )}
        </div>

        <Card padding={false}>
          {/* Search bar */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="user-search"
                type="text"
                placeholder="Cari berdasarkan nama, NIM, atau email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Table Area */}
          {error && !loading ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
            </div>
          ) : !loading && users.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <Table
                columns={columns}
                data={users}
                loading={loading}
                skeletonRows={5}
                emptyMessage={debouncedSearch ? `Tidak ada user ditemukan untuk "${debouncedSearch}"` : "Belum ada data user."}
              />
              <Pagination 
                currentPage={page} 
                hasMore={hasMore} 
                onPageChange={handlePageChange} 
                loading={loading} 
              />
            </>
          )}

          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              {!loading ? `${users.length} user ditemukan` : 'Memuat data...'}
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Shield size={12} />
              <span className="font-medium">Admin access only</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirm}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        loading={actionLoading}
        variant={confirm?.action === 'ban' ? 'danger' : 'warning'}
        title={
          confirm?.action === 'ban'
            ? `Ban "${confirm?.user?.name}"?`
            : `Unban "${confirm?.user?.name}"?`
        }
        message={
          confirm?.action === 'ban'
            ? `Ini akan memblokir akses ${confirm?.user?.name} (NIM: ${confirm?.user?.nim}) dari platform. Tindakan ini bisa dibatalkan.`
            : `Ini akan memulihkan akses ${confirm?.user?.name} (NIM: ${confirm?.user?.nim}) ke platform.`
        }
        confirmLabel={confirm?.action === 'ban' ? 'Ya, Ban User' : 'Ya, Unban User'}
      />
    </>
  )
}
