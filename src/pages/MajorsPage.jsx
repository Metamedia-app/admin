import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Plus, Building2, Edit, RefreshCw } from 'lucide-react'
import Card    from '../components/Card'
import Table   from '../components/Table'
import Button  from '../components/Button'
import Modal   from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { majorsApi } from '../services/api'

function getAvatarProps(name) {
  const colors = [
    'from-blue-500 to-cyan-400 shadow-blue-500/30',
    'from-violet-500 to-fuchsia-400 shadow-violet-500/30',
    'from-emerald-500 to-teal-400 shadow-emerald-500/30',
    'from-orange-500 to-amber-400 shadow-orange-500/30',
    'from-pink-500 to-rose-400 shadow-pink-500/30',
    'from-indigo-500 to-indigo-400 shadow-indigo-500/30'
  ]
  const cleanName = (name || 'Prodi').trim()
  const charCode = cleanName.charCodeAt(0) || 0
  const color = colors[charCode % colors.length]
  return { color }
}

export default function MajorsPage() {
  const toast = useToast()

  const [majors, setMajors] = useState([])
  const [loadingMajors, setLoadingMajors] = useState(true)
  const [showMajorModal, setShowMajorModal] = useState(false)
  const [majorForm, setMajorForm] = useState({ name: '', faculty: '', code_prodi: '', singkatan: '' })
  const [submittingMajor, setSubmittingMajor] = useState(false)
  const [editingMajor, setEditingMajor] = useState(null)

  const fetchMajors = useCallback(async () => {
    setLoadingMajors(true)
    try {
      const data = await majorsApi.getAll()
      const list = data?.data ?? data ?? []
      setMajors(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat jurusan' })
    } finally {
      setLoadingMajors(false)
    }
  }, [toast])

  useEffect(() => { fetchMajors() }, [fetchMajors])

  const handleCreateMajor = async (e) => {
    e.preventDefault()
    if (!majorForm.name?.trim() || !majorForm.code_prodi?.trim()) {
      toast.error('Nama jurusan dan Kode Prodi wajib diisi.', { title: 'Form Tidak Lengkap' })
      return
    }
    setSubmittingMajor(true)
    try {
      if (editingMajor) {
        const id = editingMajor._id || editingMajor.id
        await majorsApi.update(id, majorForm)
        toast.success(`Jurusan "${majorForm.name}" berhasil diperbarui!`, { title: 'Berhasil' })
      } else {
        await majorsApi.create(majorForm)
        toast.success(`Jurusan "${majorForm.name}" berhasil ditambahkan!`, { title: 'Berhasil' })
      }
      setShowMajorModal(false)
      setMajorForm({ name: '', faculty: '', code_prodi: '', singkatan: '' })
      setEditingMajor(null)
      fetchMajors()
    } catch (err) {
      toast.error(err.message, { title: editingMajor ? 'Gagal Memperbarui Jurusan' : 'Gagal Menambah Jurusan' })
    } finally {
      setSubmittingMajor(false)
    }
  }

  const majorColumns = [
    {
      key: 'name',
      label: 'Program Studi',
      render: (row) => {
        const avatar = getAvatarProps(row.name)
        return (
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center flex-shrink-0 shadow-lg text-white`}>
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-[13px]">{row.name || '-'}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'faculty',
      label: 'Fakultas',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600">{row.faculty || '—'}</span>
        </div>
      ),
    },
    {
      key: 'code_prodi',
      label: 'Kode Prodi',
      render: (row) => (
        <span className="inline-flex font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md shadow-sm tracking-widest">
          {row.code_prodi || '—'}
        </span>
      ),
    },
    {
      key: 'singkatan',
      label: 'Singkatan',
      render: (row) => (
        row.singkatan ? (
          <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
            {row.singkatan}
          </span>
        ) : <span className="text-slate-300 text-xs">—</span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingMajor(row)
            setMajorForm({
              name: row.name || '',
              faculty: row.faculty || '',
              code_prodi: row.code_prodi || '',
              singkatan: row.singkatan || ''
            })
            setShowMajorModal(true)
          }}
        >
          <Edit size={13} className="mr-1" /> Edit
        </Button>
      ),
    },
  ]

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all'

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Program Studi</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola master data program studi / jurusan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Prodi</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{majors.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fakultas Aktif</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{new Set(majors.map(m => m.faculty).filter(f => f && f !== '-')).size}</p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Daftar Program Studi</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={fetchMajors} loading={loadingMajors}>
                <RefreshCw size={14} className={loadingMajors ? 'animate-spin' : ''} />
              </Button>
              <Button variant="primary" size="sm" onClick={() => {
                setEditingMajor(null)
                setMajorForm({ name: '', faculty: '', code_prodi: '', singkatan: '' })
                setShowMajorModal(true)
              }}>
                <Plus size={14} /> Tambah Prodi
              </Button>
            </div>
          </div>
          
          <Card noPadding>
            <Table
              columns={majorColumns}
              data={majors}
              loading={loadingMajors}
              emptyMessage="Belum ada data program studi."
              getRowClassName={() => "hover:shadow-md hover:-translate-y-[2px] hover:bg-slate-50 transition-all duration-300 relative hover:z-20"}
            />
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showMajorModal}
        onClose={() => {
          setShowMajorModal(false)
          setEditingMajor(null)
        }}
        title={editingMajor ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleCreateMajor} className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Nama Program Studi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={majorForm.name}
              onChange={(e) => setMajorForm(p => ({ ...p, name: e.target.value }))}
              className={inputCls}
              placeholder="cth: Teknik Informatika"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Fakultas</label>
            <input
              type="text"
              value={majorForm.faculty}
              onChange={(e) => setMajorForm(p => ({ ...p, faculty: e.target.value }))}
              className={inputCls}
              placeholder="cth: Fakultas Ilmu Komputer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Kode Prodi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={majorForm.code_prodi}
                onChange={(e) => setMajorForm(p => ({ ...p, code_prodi: e.target.value }))}
                className={inputCls}
                placeholder="cth: INFA"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Singkatan</label>
              <input
                type="text"
                value={majorForm.singkatan}
                onChange={(e) => setMajorForm(p => ({ ...p, singkatan: e.target.value }))}
                className={inputCls}
                placeholder="cth: TI"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowMajorModal(false)
                setEditingMajor(null)
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={submittingMajor}>
              {editingMajor ? 'Simpan Perubahan' : 'Tambah Prodi'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
