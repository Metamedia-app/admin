import { useState, useEffect, useRef } from 'react'
import { Search, UserX, UserCheck, Users, AlertTriangle, Shield, SearchX, Edit, Upload } from 'lucide-react'
import Card         from '../components/Card'
import * as XLSX from 'xlsx'
import Table        from '../components/Table'
import Button       from '../components/Button'
import Badge        from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import Pagination   from '../components/Pagination'
import Modal        from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { usersApi, majorsApi } from '../services/api'

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

  // Edit and Import States
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [previewData, setPreviewData] = useState([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    nama: '',
    email: '',
    program_studi: '',
    status_mahasiswa: 'AKTIF',
    role: 'user',
    password: ''
  })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [majors, setMajors] = useState([])

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const data = await majorsApi.getAll()
        const list = data?.data ?? data ?? []
        setMajors(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Error fetching majors:', err)
      }
    }
    fetchMajors()
  }, [])
  
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

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportFile(null)
    setPreviewData([])
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      setImportFile(null)
      setPreviewData([])
      return
    }
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('File harus berupa format Excel (.xlsx atau .xls)', { title: 'Format Salah' })
      setImportFile(null)
      setPreviewData([])
      return
    }

    setImportFile(file)
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        
        // Find the first row that has actual content (this will be our header)
        let headerRowIdx = -1
        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i]
          if (row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
            headerRowIdx = i
            break
          }
        }

        if (headerRowIdx !== -1) {
          const headers = rawRows[headerRowIdx].map(h => String(h || '').trim())
          
          // Parse subsequent rows as objects
          const dataRows = []
          for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
            const row = rawRows[i]
            // Skip if row is completely empty
            if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) continue
            
            const obj = {}
            headers.forEach((header, colIdx) => {
              if (header) {
                obj[header] = row[colIdx] !== undefined ? row[colIdx] : ''
              }
            })
            dataRows.push(obj)
          }
          setPreviewData(dataRows)
        } else {
          setPreviewData([])
        }
      } catch (err) {
        console.error('Error parsing Excel:', err)
        toast.error('Gagal membaca data dari file Excel.', { title: 'Gagal Parse' })
        setPreviewData([])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const formatCellValue = (val) => {
    if (val instanceof Date) {
      return val.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return String(val ?? '')
  }

  const renderPreviewTable = () => {
    if (!previewData || previewData.length === 0) return null

    const headers = Object.keys(previewData[0])

    return (
      <div className="space-y-2 mt-4">
        <label className="block text-xs font-semibold text-slate-600">
          Pratinjau Data Excel ({previewData.length} baris terdeteksi)
        </label>
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {previewData.slice(0, 10).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    {headers.map((h, colIdx) => (
                      <td key={colIdx} className="px-3 py-2 border-r border-slate-100 last:border-r-0 max-w-[200px] truncate">
                        {formatCellValue(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 10 && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center">
              Menampilkan 10 baris pertama dari total {previewData.length} baris.
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleImportExcel = async (e) => {
    e.preventDefault()
    if (!importFile) {
      toast.error('Pilih file Excel (.xlsx) terlebih dahulu.', { title: 'File Kosong' })
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)

    setImporting(true)
    try {
      await usersApi.importExcel(formData)
      toast.success('Daftar pengguna berhasil diimport massal!', { title: 'Berhasil' })
      closeImportModal()
      setPage(1)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Import User' })
    } finally {
      setImporting(false)
    }
  }

  const openEditModal = (user) => {
    const raw = user.raw || {}
    let normalizedRole = raw.role || 'mahasiswa'
    if (normalizedRole === 'user') normalizedRole = 'mahasiswa'

    let normalizedStatus = raw.status_mahasiswa || 'AKTIF'
    if (normalizedStatus === 'TIDAK AKTIF') normalizedStatus = 'TIDAK_AKTIF'

    setEditingUser(user)
    setEditForm({
      nama: raw.nama || raw.name || user.name || '',
      email: raw.email || '',
      program_studi: raw.program_studi || '',
      status_mahasiswa: normalizedStatus,
      role: normalizedRole,
      password: ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.nama.trim()) {
      toast.error('Nama wajib diisi.', { title: 'Form Tidak Lengkap' })
      return
    }

    setEditSubmitting(true)
    try {
      const body = {
        nama: editForm.nama.trim(),
        email: editForm.email.trim(),
        program_studi: editForm.program_studi,
        status_mahasiswa: editForm.status_mahasiswa,
        role: editForm.role
      }
      if (editForm.password.trim()) {
        body.password = editForm.password.trim()
      }

      await usersApi.update(editingUser.id, body)
      toast.success(`Akun "${body.nama}" berhasil diperbarui!`, { title: 'Berhasil' })
      setShowEditModal(false)
      setEditingUser(null)
      
      setUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          const updatedRaw = { 
            ...u.raw, 
            nama: body.nama, 
            email: body.email, 
            program_studi: body.program_studi, 
            status_mahasiswa: body.status_mahasiswa, 
            role: body.role 
          }
          return normalizeUser(updatedRaw)
        }
        return u
      }))
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Memperbarui Akun' })
    } finally {
      setEditSubmitting(false)
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
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditModal(row)}>
            <Edit size={13} /> Edit
          </Button>
          {row.status === 'banned' ? (
            <Button variant="success" size="sm" onClick={() => openConfirm(row, 'unban')}>
              <UserCheck size={13} /> Unban
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={() => openConfirm(row, 'ban')}>
              <UserX size={13} /> Ban
            </Button>
          )}
        </div>
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
          <div className="flex flex-wrap items-center gap-2">
            {hasSearched && users.length > 0 && (
              <>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Users size={13} /> {activeCount} Aktif
                </span>
                <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <UserX size={13} /> {bannedCount} Dibanned
                </span>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload size={13} /> Import Excel
            </Button>
          </div>
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

      {/* Modal Edit Pengguna */}
      {showEditModal && editingUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingUser(null) }}
          title={`Edit Akun User: ${editingUser.name}`}
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap..."
                value={editForm.nama}
                onChange={e => setEditForm(prev => ({ ...prev, nama: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="Masukkan email..."
                value={editForm.email}
                onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
                >
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Status Mahasiswa <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.status_mahasiswa}
                  onChange={e => setEditForm(prev => ({ ...prev, status_mahasiswa: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="TIDAK_AKTIF">Tidak Aktif</option>
                  <option value="ALUMNI">Alumni (Otomatis Sinkron Grup Alumni)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Program Studi
              </label>
              <select
                value={editForm.program_studi}
                onChange={e => setEditForm(prev => ({ ...prev, program_studi: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              >
                <option value="">-- Pilih Program Studi --</option>
                {majors.map(m => (
                  <option key={m._id || m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Ubah Password <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="password"
                placeholder="Kosongkan jika tidak ingin mengganti password..."
                value={editForm.password}
                onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowEditModal(false); setEditingUser(null) }}>
                Batal
              </Button>
              <Button type="submit" variant="primary" className="flex-1" loading={editSubmitting}>
                <Edit size={14} /> Simpan Perubahan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Import Excel */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={closeImportModal}
          title="Import User Massal via Excel"
          size="lg"
        >
          <form onSubmit={handleImportExcel} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Pilih Berkas Excel (.xlsx, .xls) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Format kolom berkas Excel (.xlsx): <strong>nim, nama, email, password, role, program_studi, status_mahasiswa</strong>.
              </p>
            </div>

            {renderPreviewTable()}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeImportModal}>
                Batal
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-1" 
                loading={importing}
                disabled={!importFile || importing}
              >
                <Upload size={14} /> Import Berkas
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
