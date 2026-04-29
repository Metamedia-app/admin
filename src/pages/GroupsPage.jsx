import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, X, RefreshCw, MessageSquare,
  UserPlus, BookOpen, CalendarDays, Trash2, Search, Loader2
} from 'lucide-react'
import Card    from '../components/Card'
import Table   from '../components/Table'
import Button  from '../components/Button'
import Modal   from '../components/Modal'
import Badge   from '../components/Badge'
import { useToast } from '../context/ToastContext'
import { groupsApi, usersApi } from '../services/api'

function extractGroups(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.groups)) return data.groups
  if (data.data && Array.isArray(data.data.groups)) return data.data.groups
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function GroupsPage() {
  const toast = useToast()
  const [groups, setGroups]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  
  // Member Selector States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await groupsApi.getAll()
      setGroups(extractGroups(data))
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat grup' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  // Debounced User Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const data = await usersApi.search(searchQuery, 5)
        const results = data.data?.users || data.users || []
        setSearchResults(results)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleUserSelection = (user) => {
    const isSelected = selectedUsers.some(u => u._id === user._id)
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Pilih minimal 1 mahasiswa.', { title: 'Belum Ada Pilihan' })
      return
    }
    
    setSubmitting(true)
    try {
      const nims = selectedUsers.map(u => u.nim)
      await groupsApi.addMembers(selectedGroup.id, nims)
      toast.success(`${selectedUsers.length} mahasiswa berhasil ditambahkan ke grup "${selectedGroup.name}".`, { title: 'Berhasil' })
      closeModal()
      fetchGroups(true)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Menambahkan Member' })
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setSelectedGroup(null)
    setSearchQuery('')
    setSelectedUsers([])
    setSearchResults([])
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Grup',
      render: (row) => {
        const name = row.name || row.subject_name || row.group_name || '-'
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{name}</p>
              {(row.subject_code || row.code) && (
                <span className="text-[10px] font-mono text-slate-400">
                  {row.subject_code || row.code}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'academic_year',
      label: 'Tahun Akademik',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarDays size={13} className="text-slate-400" />
          {row.academic_year || '-'}
        </span>
      ),
    },
    {
      key: 'member_count',
      label: 'Anggota',
      render: (row) => {
        const count = row.member_count ?? row.members_count ?? (Array.isArray(row.members) ? row.members.length : '-')
        return (
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">{count}</span>
          </div>
        )
      },
    },
    {
      key: 'expires_at',
      label: 'Berakhir',
      render: (row) => {
        if (!row.expires_at) return <span className="text-slate-400 text-xs">—</span>
        const d = new Date(row.expires_at)
        const expired = d < new Date()
        return (
          <Badge
            label={expired ? 'Kedaluwarsa' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            variant={expired ? 'removed' : 'active'}
          />
        )
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => {
        const id   = row._id || row.id || row.conversation_id
        const name = row.name || row.subject_name || 'Grup'
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSelectedGroup({ id, name })}
          >
            <UserPlus size={13} /> Tambah Member
          </Button>
        )
      },
    },
  ]

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Grup Chat Matkul</h2>
            <p className="text-sm text-slate-500 mt-0.5">Lihat semua grup dan kelola anggotanya</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchGroups(true)} loading={refreshing}>
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>

        <Card padding={false}>
          <Table
            columns={columns}
            data={groups}
            loading={loading}
            skeletonRows={5}
            emptyMessage="Belum ada grup chat yang aktif."
          />
          <div className="px-4 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <span>{groups.length} grup aktif</span>
          </div>
        </Card>
      </div>

      {/* Modal Tambah Member (New UI) */}
      {selectedGroup && (
        <Modal
          isOpen={!!selectedGroup}
          onClose={closeModal}
          title={`Tambah Member ke "${selectedGroup.name}"`}
          size="lg"
        >
          <div className="p-6 space-y-6">
            {/* Search Section */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Cari Mahasiswa (NIM atau Nama)</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Masukkan NIM atau Nama..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                />
                {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user._id}
                      onClick={() => toggleUserSelection(user)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar_url || 'https://ui-avatars.com/api/?name=' + user.nama} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-100" 
                          alt="" 
                        />
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">{user.nama}</p>
                          <p className="text-xs text-slate-400 font-mono">{user.nim}</p>
                        </div>
                      </div>
                      <Plus size={16} className="text-primary-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Siap Ditambahkan ({selectedUsers.length})</h4>
                {selectedUsers.length > 0 && (
                  <button onClick={() => setSelectedUsers([])} className="text-[10px] font-bold text-red-500 hover:underline">Hapus Semua</button>
                )}
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {selectedUsers.length === 0 ? (
                  <div className="py-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                    <Users size={24} className="mb-2 opacity-20" />
                    <p className="text-xs">Cari dan pilih mahasiswa di atas</p>
                  </div>
                ) : (
                  selectedUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url || 'https://ui-avatars.com/api/?name=' + user.nama} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{user.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{user.nim}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleUserSelection(user)} 
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors shadow-sm border border-red-100"
                        title="Hapus dari daftar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>Batal</Button>
              <Button 
                type="button" 
                variant="primary" 
                className="flex-1" 
                loading={submitting}
                disabled={selectedUsers.length === 0}
                onClick={handleAddMembers}
              >
                <UserPlus size={14} /> Tambahkan ke Grup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
