import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Edit, RefreshCw, Upload, Image as ImageIcon, Info } from 'lucide-react'
import Card    from '../components/Card'
import Table   from '../components/Table'
import Button  from '../components/Button'
import Modal   from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { communitiesApi } from '../services/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://besosmed-production.up.railway.app'

function getAvatarProps(name) {
  const colors = [
    'from-blue-500 to-cyan-400',
    'from-violet-500 to-fuchsia-400',
    'from-emerald-500 to-teal-400',
    'from-orange-500 to-amber-400',
    'from-pink-500 to-rose-400'
  ]
  const cleanName = (name || 'AC').trim()
  const words = cleanName.split(' ').filter(w => w.length > 0)
  let initials = 'AC'
  if (words.length >= 2) initials = (words[0][0] + words[1][0]).toUpperCase()
  else if (words.length === 1) initials = cleanName.substring(0, 2).toUpperCase()
  
  const charCode = cleanName.charCodeAt(0) || 0
  const color = colors[charCode % colors.length]
  return { initials, color }
}

export default function AlumniGroupsPage() {
  const toast = useToast()

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRef = useRef(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const data = await communitiesApi.getAlumni()
      const list = data?.data ?? data ?? []
      setGroups(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat grup alumni' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const handleEditClick = (group) => {
    setEditingGroup(group)
    setEditForm({
      name: group.name || '',
      description: group.description || ''
    })
    setAvatarFile(null)
    setAvatarPreview(group.avatar_url ? `${BASE_URL}${group.avatar_url}` : null)
    setShowEditModal(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG/PNG).', { title: 'Format Tidak Didukung' })
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) {
      toast.error('Nama komunitas wajib diisi.', { title: 'Form Tidak Lengkap' })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', editForm.name)
      if (editForm.description) formData.append('description', editForm.description)
      if (avatarFile) formData.append('avatar', avatarFile)

      const id = editingGroup._id || editingGroup.id
      await communitiesApi.update(id, formData)
      
      toast.success(`Grup Alumni "${editForm.name}" berhasil diperbarui.`, { title: 'Berhasil' })
      setShowEditModal(false)
      fetchGroups()
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Memperbarui' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Grup Alumni',
      render: (row) => {
        const name = row.name || '-'
        const avatar = getAvatarProps(name)
        const imgSrc = row.avatar_url ? `${BASE_URL}${row.avatar_url}` : null
        
        return (
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${imgSrc ? '' : `bg-gradient-to-br ${avatar.color}`} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden relative`}>
              {imgSrc ? (
                <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm tracking-widest">{avatar.initials}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800">{name}</p>
              {row.is_default_alumni && (
                <span className="inline-block mt-0.5 text-[10px] font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Grup Bawaan
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (row) => (
        <p className="text-sm text-slate-600 line-clamp-2 max-w-xs" title={row.description}>
          {row.description || <span className="text-slate-400 italic">Tidak ada deskripsi</span>}
        </p>
      ),
    },
    {
      key: 'creator',
      label: 'Dibuat Oleh',
      render: (row) => {
        if (!row.creator_id) return <span className="text-slate-400 text-sm">—</span>
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">{row.creator_id.nama || 'Admin'}</span>
            {row.creator_id.nim && <span className="text-xs text-slate-400">{row.creator_id.nim}</span>}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleEditClick(row)}
        >
          <Edit size={13} className="mr-1" /> Edit
        </Button>
      ),
    },
  ]

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all'

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Komunitas Alumni</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola grup dan komunitas ikatan alumni</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Komunitas</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{groups.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Daftar Komunitas</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={fetchGroups} loading={loading}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Segarkan
              </Button>
            </div>
          </div>
          
          <Card noPadding>
            <Table
              columns={columns}
              data={groups}
              loading={loading}
              skeletonRows={3}
              emptyMessage="Belum ada komunitas alumni yang dibuat."
              getRowClassName={() => "hover:shadow-md hover:-translate-y-[2px] hover:bg-slate-50 transition-all duration-300 relative hover:z-20"}
            />
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          if (isSubmitting) return
          setShowEditModal(false)
        }}
        title="Edit Profil Komunitas"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitEdit} className="p-6 space-y-5">
          {/* Avatar Upload Area */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex items-center justify-center transition-colors group-hover:border-primary-400">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-xl shadow-lg hover:bg-primary-700 transition-transform hover:scale-105 active:scale-95"
              >
                <Upload size={14} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-[10px] text-slate-400">Rekomendasi: Persegi (1:1), Max 2MB.</p>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-700">
            <Info size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
            <p className="leading-snug text-xs">Hanya nama, deskripsi, dan avatar yang dapat diubah oleh Admin. Anggota grup dikelola langsung di aplikasi mobile.</p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Nama Komunitas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
              className={inputCls}
              placeholder="cth: Ikatan Alumni 2026"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Tuliskan deskripsi singkat mengenai komunitas ini..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
