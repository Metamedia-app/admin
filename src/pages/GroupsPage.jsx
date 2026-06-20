import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, X, RefreshCw, MessageSquare,
  UserPlus, BookOpen, CalendarDays, Trash2, Search, Loader2, Eye, Upload
} from 'lucide-react'
import Card    from '../components/Card'
import * as XLSX from 'xlsx'
import Table   from '../components/Table'
import Button  from '../components/Button'
import Modal   from '../components/Modal'
import Badge   from '../components/Badge'
import { useToast } from '../context/ToastContext'
import { groupsApi, usersApi, chatSyncApi, subjectsApi } from '../services/api'

function extractSubjects(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.subjects)) return data.subjects
  if (data.data && Array.isArray(data.data.subjects)) return data.data.subjects
  if (Array.isArray(data.data)) return data.data
  return []
}

function extractGroups(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.groups)) return data.groups
  if (data.data && Array.isArray(data.data.groups)) return data.data.groups
  if (Array.isArray(data.data)) return data.data
  return []
}

function extractMembers(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.members)) return data.members
  if (data.data && Array.isArray(data.data.members)) return data.data.members
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
  
  // View Members States
  const [viewingGroup, setViewingGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)

  // Create Group States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [createForm, setCreateForm] = useState({
    subjectIndex: '',
    lecturer_nim: '',
    expires_at: ''
  })
  const [createSearchQuery, setCreateSearchQuery] = useState('')
  const [createSearchResults, setCreateSearchResults] = useState([])
  const [createSelectedUsers, setCreateSelectedUsers] = useState([])
  const [createIsSearching, setCreateIsSearching] = useState(false)
  const [createIsBulkMode, setCreateIsBulkMode] = useState(false)
  const [createBulkInput, setCreateBulkInput] = useState('')
  const [createIsBulkProcessing, setCreateIsBulkProcessing] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // Lecturer Search States
  const [lecturerSearchQuery, setLecturerSearchQuery] = useState('')
  const [lecturerSearchResults, setLecturerSearchResults] = useState([])
  const [isSearchingLecturer, setIsSearchingLecturer] = useState(false)
  const [selectedLecturer, setSelectedLecturer] = useState(null)
  const [isManualLecturer, setIsManualLecturer] = useState(false)

  // Group Import States
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [previewData, setPreviewData] = useState([])

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

  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true)
    try {
      const data = await subjectsApi.getAll()
      setSubjects(extractSubjects(data))
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat mata kuliah' })
    } finally {
      setLoadingSubjects(false)
    }
  }, [toast])

  useEffect(() => { 
    fetchGroups()
    fetchSubjects()
  }, [fetchGroups, fetchSubjects])

  // Debounced User Search for Create Group
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (createSearchQuery.length < 3) {
        setCreateSearchResults([])
        return
      }
      setCreateIsSearching(true)
      try {
        const data = await usersApi.search(createSearchQuery, 5)
        const results = data.data?.users || data.users || []
        setCreateSearchResults(results)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setCreateIsSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [createSearchQuery])

  // Debounced User Search for Lecturer
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (lecturerSearchQuery.length < 3) {
        setLecturerSearchResults([])
        return
      }
      setIsSearchingLecturer(true)
      try {
        const data = await usersApi.search(lecturerSearchQuery, 5)
        const results = data.data?.users || data.users || []
        setLecturerSearchResults(results)
      } catch (err) {
        console.error('Lecturer search error:', err)
      } finally {
        setIsSearchingLecturer(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [lecturerSearchQuery])

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

  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  const handleProcessBulk = async () => {
    if (!bulkInput.trim()) return
    
    // Split by comma, newline, or space
    const nims = bulkInput.split(/[,\n\s]+/).filter(nim => nim.trim().length >= 3)
    const uniqueNims = [...new Set(nims)]
    
    setIsBulkProcessing(true)
    const newUsers = []

    try {
      for (const nim of uniqueNims) {
        // Skip if already in selectedUsers
        if (selectedUsers.some(u => u.nim === nim)) continue

        try {
          // Search for this specific NIM
          const data = await usersApi.search(nim.trim(), 1)
          const results = data.data?.users || data.users || []
          
          // Find the exact NIM match in results
          const exactMatch = results.find(u => u.nim === nim.trim())
          
          if (exactMatch) {
            newUsers.push(exactMatch)
          } else {
            // If not found in database, keep it as manual entry with placeholder
            newUsers.push({
              _id: `manual-${nim}`,
              nim: nim.trim(),
              nama: `NIM ${nim} (Tidak ditemukan)`,
              avatar_url: null,
              isManual: true
            })
          }
        } catch (err) {
          console.error(`Error fetching NIM ${nim}:`, err)
          newUsers.push({
            _id: `err-${nim}`,
            nim: nim.trim(),
            nama: `NIM ${nim} (Error)`,
            isManual: true
          })
        }
      }

      if (newUsers.length > 0) {
        setSelectedUsers(prev => [...prev, ...newUsers])
        toast.success(`Berhasil memproses ${newUsers.length} mahasiswa.`)
      }
      
      setBulkInput('')
      setIsBulkMode(false)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleViewMembers = async (group) => {
    setViewingGroup(group)
    setLoadingMembers(true)
    try {
      const data = await groupsApi.getMembers(group.id)
      setGroupMembers(extractMembers(data))
    } catch (err) {
      toast.error('Gagal mengambil daftar member', { title: 'Error' })
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleKickMember = async (userId, userName) => {
    if (!confirm(`Keluarkan ${userName} dari grup ini?`)) return
    
    try {
      await groupsApi.kickMember(viewingGroup.id, userId)
      toast.success(`${userName} berhasil dikeluarkan.`)
      // Hapus dari list modal
      setGroupMembers(prev => prev.filter(m => m._id !== userId && m.id !== userId))
      fetchGroups(true) // Update jumlah member di tabel
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Mengeluarkan' })
    }
  }

  const closeModal = () => {
    setSelectedGroup(null)
    setSearchQuery('')
    setSelectedUsers([])
    setSearchResults([])
    setIsBulkMode(false)
    setBulkInput('')
  }

  const toggleCreateUserSelection = (user) => {
    const isSelected = createSelectedUsers.some(u => u._id === user._id)
    if (isSelected) {
      setCreateSelectedUsers(createSelectedUsers.filter(u => u._id !== user._id))
    } else {
      setCreateSelectedUsers([...createSelectedUsers, user])
    }
    setCreateSearchQuery('')
    setCreateSearchResults([])
  }

  const handleCreateProcessBulk = async () => {
    if (!createBulkInput.trim()) return
    
    const nims = createBulkInput.split(/[,\n\s]+/).filter(nim => nim.trim().length >= 3)
    const uniqueNims = [...new Set(nims)]
    
    setCreateIsBulkProcessing(true)
    const newUsers = []

    try {
      for (const nim of uniqueNims) {
        if (createSelectedUsers.some(u => u.nim === nim)) continue

        try {
          const data = await usersApi.search(nim.trim(), 1)
          const results = data.data?.users || data.users || []
          const exactMatch = results.find(u => u.nim === nim.trim())
          
          if (exactMatch) {
            newUsers.push(exactMatch)
          } else {
            newUsers.push({
              _id: `manual-${nim}`,
              nim: nim.trim(),
              nama: `NIM ${nim} (Tidak ditemukan)`,
              avatar_url: null,
              isManual: true
            })
          }
        } catch (err) {
          console.error(`Error fetching NIM ${nim}:`, err)
          newUsers.push({
            _id: `err-${nim}`,
            nim: nim.trim(),
            nama: `NIM ${nim} (Error)`,
            isManual: true
          })
        }
      }

      if (newUsers.length > 0) {
        setCreateSelectedUsers(prev => [...prev, ...newUsers])
        toast.success(`Berhasil memproses ${newUsers.length} mahasiswa.`)
      }
      
      setCreateBulkInput('')
      setCreateIsBulkMode(false)
    } finally {
      setCreateIsBulkProcessing(false)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    
    if (createForm.subjectIndex === '') {
      toast.error('Pilih mata kuliah terlebih dahulu.', { title: 'Form Belum Lengkap' })
      return
    }
    if (!createForm.lecturer_nim.trim()) {
      toast.error('NIM Dosen wajib diisi.', { title: 'Form Belum Lengkap' })
      return
    }
    if (!createForm.expires_at) {
      toast.error('Tanggal kadaluwarsa wajib diisi.', { title: 'Form Belum Lengkap' })
      return
    }

    const selectedSubject = subjects[Number(createForm.subjectIndex)]
    if (!selectedSubject) {
      toast.error('Mata kuliah tidak valid.', { title: 'Error' })
      return
    }

    setCreateSubmitting(true)
    try {
      const payload = {
        subject_name: selectedSubject.name || selectedSubject.subject_name,
        subject_code: selectedSubject.code || selectedSubject.subject_code,
        academic_year: selectedSubject.academic_year,
        lecturer_nim: createForm.lecturer_nim.trim(),
        expires_at: new Date(createForm.expires_at).toISOString(),
        students: createSelectedUsers.map(u => u.nim)
      }
      
      await chatSyncApi.sync(payload)
      toast.success(`Grup chat "${payload.subject_name}" berhasil dibuat.`, { title: 'Berhasil' })
      closeCreateModal()
      fetchGroups(true)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Membuat Grup' })
    } finally {
      setCreateSubmitting(false)
    }
  }

  const selectLecturer = (user) => {
    setSelectedLecturer({
      nama: user.nama || user.name,
      nim: user.nim
    })
    setCreateForm(prev => ({ ...prev, lecturer_nim: user.nim }))
    setLecturerSearchQuery('')
    setLecturerSearchResults([])
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateForm({
      subjectIndex: '',
      lecturer_nim: '',
      expires_at: ''
    })
    setCreateSearchQuery('')
    setCreateSearchResults([])
    setCreateSelectedUsers([])
    setCreateIsBulkMode(false)
    setCreateBulkInput('')
    setLecturerSearchQuery('')
    setLecturerSearchResults([])
    setSelectedLecturer(null)
    setIsManualLecturer(false)
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
      await chatSyncApi.importExcel(formData)
      toast.success('Grup chat berhasil diimport massal!', { title: 'Berhasil' })
      closeImportModal()
      fetchGroups(true)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Import Grup' })
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteGroup = async (id, name) => {
    if (!confirm(`Hapus grup chat "${name}" beserta avatarnya? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await groupsApi.delete(id)
      toast.success(`Grup chat "${name}" berhasil dihapus beserta avatarnya.`)
      fetchGroups(true)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Menghapus Grup' })
    }
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleViewMembers({ id, name })}
            >
              <Eye size={13} /> Detail
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedGroup({ id, name })}
            >
              <UserPlus size={13} /> Tambah
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteGroup(id, name)}
            >
              <Trash2 size={13} /> Hapus
            </Button>
          </div>
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
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fetchGroups(true)} loading={refreshing}>
              <RefreshCw size={13} /> Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload size={13} /> Import Excel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> Tambah Grup
            </Button>
          </div>
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
            {/* Header & Toggle */}
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isBulkMode ? 'Input Masal NIM' : 'Cari Mahasiswa'}
              </label>
              <button 
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 px-2 py-1 bg-primary-50 rounded-lg transition-colors"
              >
                {isBulkMode ? <Search size={12} /> : <Plus size={12} />}
                {isBulkMode ? 'Pindah ke Cari' : 'Mode Masal (Paste NIM)'}
              </button>
            </div>

            {/* Input Section */}
            {!isBulkMode ? (
              <div className="relative">
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
            ) : (
              <div className="space-y-3">
                <textarea
                  placeholder="Tempel daftar NIM di sini (pisahkan dengan koma atau baris baru)...&#10;Contoh:&#10;225501, 225502&#10;225503"
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  className="w-full h-32 p-4 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-mono"
                />
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full"
                  loading={isBulkProcessing}
                  disabled={!bulkInput.trim() || isBulkProcessing}
                  onClick={handleProcessBulk}
                >
                  Proses &amp; Masukkan ke Antrean
                </Button>
              </div>
            )}

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

      {/* Modal Detail Member */}
      {viewingGroup && (
        <Modal
          isOpen={!!viewingGroup}
          onClose={() => setViewingGroup(null)}
          title={`Member Grup "${viewingGroup.name}"`}
          size="md"
        >
          <div className="p-6">
            {loadingMembers ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="text-primary-500 animate-spin" />
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada member di grup ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {groupMembers.map(member => {
                  const uId = member._id || member.id
                  const uName = member.nama || member.name || member.nim
                  const uNim = member.nim
                  return (
                    <div key={uId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar_url || 'https://ui-avatars.com/api/?name=' + uName} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{uName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{uNim}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleKickMember(uId, uName)}
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors shadow-sm border border-red-100"
                        title="Keluarkan dari grup"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="mt-6">
              <Button type="button" variant="secondary" className="w-full" onClick={() => setViewingGroup(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Tambah Grup Baru */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={closeCreateModal}
          title="Tambah Grup Chat Baru"
          size="lg"
        >
          <form onSubmit={handleCreateGroup} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Pilih Mata Kuliah <span className="text-red-500">*</span>
                </label>
                {loadingSubjects ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin text-primary-500" />
                    Memuat mata kuliah...
                  </div>
                ) : (
                  <select
                    value={createForm.subjectIndex}
                    onChange={e => setCreateForm(prev => ({ ...prev, subjectIndex: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
                  >
                    <option value="">-- Pilih Mata Kuliah --</option>
                    {subjects.map((subj, idx) => (
                      <option key={subj._id || subj.id || idx} value={idx}>
                        {subj.code || subj.subject_code} - {subj.name || subj.subject_name} ({subj.academic_year})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      Dosen (Admin Grup) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualLecturer(!isManualLecturer)
                        setSelectedLecturer(null)
                        setCreateForm(prev => ({ ...prev, lecturer_nim: '' }))
                        setLecturerSearchQuery('')
                      }}
                      className="text-[10px] font-bold text-primary-600 hover:underline"
                    >
                      {isManualLecturer ? 'Cari Nama Dosen' : 'Input NIM Manual'}
                    </button>
                  </div>

                  {selectedLecturer ? (
                    <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-indigo-900">{selectedLecturer.nama}</p>
                        <p className="text-[10px] text-indigo-500 font-mono">NIM: {selectedLecturer.nim}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLecturer(null)
                          setCreateForm(prev => ({ ...prev, lecturer_nim: '' }))
                        }}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Batal
                      </button>
                    </div>
                  ) : isManualLecturer ? (
                    <input
                      type="text"
                      placeholder="Masukkan NIM Dosen..."
                      value={createForm.lecturer_nim}
                      onChange={e => setCreateForm(prev => ({ ...prev, lecturer_nim: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
                    />
                  ) : (
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama atau NIM dosen..."
                        value={lecturerSearchQuery}
                        onChange={e => setLecturerSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
                      />
                      {isSearchingLecturer && (
                        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />
                      )}

                      {/* Dropdown Suggestions */}
                      {lecturerSearchResults.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                          {lecturerSearchResults.map(user => (
                            <button
                              key={user._id}
                              type="button"
                              onClick={() => selectLecturer(user)}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left"
                            >
                              <div className="py-1">
                                <p className="text-xs font-bold text-slate-800">{user.nama || user.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{user.nim}</p>
                              </div>
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                                {user.role || 'User'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tanggal Kedaluwarsa Grup <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.expires_at}
                    onChange={e => setCreateForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Tambah Mahasiswa Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {createIsBulkMode ? 'Input Masal NIM Mahasiswa' : 'Cari Mahasiswa'}
                </label>
                <button 
                  type="button"
                  onClick={() => setCreateIsBulkMode(!createIsBulkMode)}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 px-2 py-1 bg-primary-50 rounded-lg transition-colors"
                >
                  {createIsBulkMode ? <Search size={12} /> : <Plus size={12} />}
                  {createIsBulkMode ? 'Pindah ke Cari' : 'Mode Masal (Paste NIM)'}
                </button>
              </div>

              {/* Input Section */}
              {!createIsBulkMode ? (
                <div className="relative">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Masukkan NIM atau Nama mahasiswa..."
                      value={createSearchQuery}
                      onChange={e => setCreateSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                    {createIsSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />}
                  </div>

                  {/* Search Results Dropdown */}
                  {createSearchResults.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {createSearchResults.map(user => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggleCreateUserSelection(user)}
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
              ) : (
                <div className="space-y-3">
                  <textarea
                    placeholder="Tempel daftar NIM di sini (pisahkan dengan koma atau baris baru)...&#10;Contoh:&#10;225501, 225502&#10;225503"
                    value={createBulkInput}
                    onChange={e => setCreateBulkInput(e.target.value)}
                    className="w-full h-32 p-4 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-mono"
                  />
                  <Button 
                    type="button"
                    variant="primary" 
                    size="sm" 
                    className="w-full"
                    loading={createIsBulkProcessing}
                    disabled={!createBulkInput.trim() || createIsBulkProcessing}
                    onClick={handleCreateProcessBulk}
                  >
                    Proses &amp; Masukkan ke Antrean
                  </Button>
                </div>
              )}

              {/* Selected Members Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Anggota Grup ({createSelectedUsers.length})</h4>
                  {createSelectedUsers.length > 0 && (
                    <button type="button" onClick={() => setCreateSelectedUsers([])} className="text-[10px] font-bold text-red-500 hover:underline">Hapus Semua</button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {createSelectedUsers.length === 0 ? (
                    <div className="py-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                      <Users size={24} className="mb-2 opacity-20" />
                      <p className="text-xs">Cari dan pilih mahasiswa di atas</p>
                    </div>
                  ) : (
                    createSelectedUsers.map(user => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar_url || 'https://ui-avatars.com/api/?name=' + user.nama} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{user.nama}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.nim}</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => toggleCreateUserSelection(user)} 
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
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeCreateModal}>Batal</Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-1" 
                loading={createSubmitting}
              >
                <Plus size={14} /> Buat Grup
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
          title="Import Grup Chat Massal"
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
              <p className="text-[11px] text-slate-400">
                Format Excel harus berisi kolom data yang sesuai untuk sinkronisasi massal.
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
