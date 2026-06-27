import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Plus, Building2, Edit, RefreshCw } from 'lucide-react'
import Card    from '../components/Card'
import Table   from '../components/Table'
import Button  from '../components/Button'
import Modal   from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { majorsApi } from '../services/api'

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
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={16} className="text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name || '-'}</p>
            {row.faculty && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 size={10} /> {row.faculty}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'faculty',
      label: 'Fakultas',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.faculty || '—'}</span>
      ),
    },
    {
      key: 'code_prodi',
      label: 'Kode Prodi',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
          {row.code_prodi || '—'}
        </span>
      ),
    },
    {
      key: 'singkatan',
      label: 'Singkatan',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.singkatan || '—'}</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Program Studi</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{majors.length}</p>
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
