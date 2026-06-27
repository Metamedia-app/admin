import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, X, Hash, CalendarDays, User2, RefreshCw, Edit, Trash2, Loader2 } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { subjectsApi, majorsApi } from '../services/api'

function extractSubjects(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.subjects)) return data.subjects
  if (data.data && Array.isArray(data.data.subjects)) return data.data.subjects
  if (Array.isArray(data.data)) return data.data
  return []
}

const INITIAL_FORM = { code: '', name: '', lecturer_name: '', curriculum_year: '', sks: '', semester: '', code_prodi: '' }

export default function SubjectsPage() {
  const toast = useToast()
  const [subjects, setSubjects] = useState([])
  const [majors, setMajors] = useState([])
  const [loadingMajors, setLoadingMajors] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)

  const fetchSubjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await subjectsApi.getAll()
      setSubjects(extractSubjects(data))
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat mata kuliah' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

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

  useEffect(() => { 
    fetchSubjects()
    fetchMajors()
  }, [fetchSubjects, fetchMajors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code || !form.name || !form.curriculum_year) {
      toast.error('Kode, Nama, dan Tahun Kurikulum wajib diisi.', { title: 'Form Tidak Lengkap' })
      return
    }
    setSubmitting(true)
    try {
      if (editingSubject) {
        const id = editingSubject._id || editingSubject.id
        await subjectsApi.update(id, form)
        toast.success('Mata kuliah berhasil diperbarui!', { title: 'Berhasil' })
      } else {
        await subjectsApi.create(form)
        toast.success('Mata kuliah berhasil ditambahkan!', { title: 'Berhasil' })
      }
      setShowModal(false)
      setForm(INITIAL_FORM)
      setEditingSubject(null)
      fetchSubjects(true)
    } catch (err) {
      toast.error(err.message, { title: editingSubject ? 'Gagal Memperbarui Matkul' : 'Gagal Membuat Matkul' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus mata kuliah "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await subjectsApi.delete(id)
      toast.success(`Mata kuliah "${name}" berhasil dihapus.`)
      fetchSubjects(true)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Menghapus Matkul' })
    }
  }

  const columns = [
    {
      key: 'code',
      label: 'Kode',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
          {row.code || row.subject_code || '-'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Nama Mata Kuliah',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} className="text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name || row.subject_name || '-'}</p>
            {row.lecturer_name && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <User2 size={11} /> {row.lecturer_name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'code_prodi',
      label: 'Prodi',
      render: (row) => (
        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          {row.code_prodi || '-'}
        </span>
      ),
    },
    {
      key: 'sks_semester',
      label: 'SKS / Smt',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.sks ? `${row.sks} SKS` : '-'} / Smt {row.semester || '-'}
        </span>
      ),
    },
    {
      key: 'curriculum_year',
      label: 'Tahun Kurikulum',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
          <CalendarDays size={13} className="text-slate-400" />
          {row.curriculum_year || '-'}
        </span>
      ),
    },
    {
      key: 'group_count',
      label: 'Grup Chat',
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.group_count ?? row.groups_count ?? '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => {
        const id = row._id || row.id
        const name = row.name || row.subject_name || 'Matkul'
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingSubject(row)
                setForm({
                  code: row.code || row.subject_code || '',
                  name: row.name || row.subject_name || '',
                  lecturer_name: row.lecturer_name || '',
                  curriculum_year: row.curriculum_year || '',
                  sks: row.sks || '',
                  semester: row.semester || '',
                  code_prodi: row.code_prodi || '',
                })
                setShowModal(true)
              }}
            >
              <Edit size={13} /> Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(id, name)}
            >
              <Trash2 size={13} /> Hapus
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manajemen Mata Kuliah</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola daftar mata kuliah yang tersedia untuk grup chat</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fetchSubjects(true)} loading={refreshing}>
              <RefreshCw size={13} /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Tambah Matkul
            </Button>
          </div>
        </div>

        <Card padding={false}>
          <Table
            columns={columns}
            data={subjects}
            loading={loading}
            skeletonRows={5}
            emptyMessage="Belum ada mata kuliah. Klik 'Tambah Matkul' untuk memulai."
          />
          <div className="px-4 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <span>{subjects.length} mata kuliah terdaftar</span>
          </div>
        </Card>
      </div>

      {/* Modal Tambah/Edit Matkul */}
      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setForm(INITIAL_FORM); setEditingSubject(null) }} 
        title={editingSubject ? "Edit Mata Kuliah" : "Tambah Mata Kuliah Baru"} 
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Kode Matkul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="cth: IF301"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tahun Kurikulum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="cth: 2025"
                value={form.curriculum_year}
                onChange={e => setForm(f => ({ ...f, curriculum_year: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Mata Kuliah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="cth: Pemrograman Web"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Program Studi <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            {loadingMajors ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2.5 px-3 border border-slate-200 rounded-xl bg-slate-50">
                <Loader2 size={14} className="animate-spin" /> Memuat daftar prodi...
              </div>
            ) : (
              <select
                value={form.code_prodi}
                onChange={e => setForm(f => ({ ...f, code_prodi: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all appearance-none"
              >
                <option value="">— Pilih Program Studi —</option>
                {majors.map(m => (
                  <option key={m._id || m.id} value={m.code_prodi || m.name}>
                    {m.code_prodi ? `[${m.code_prodi}] ` : ''}{m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Jumlah SKS <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="number"
                placeholder="cth: 3"
                value={form.sks}
                onChange={e => setForm(f => ({ ...f, sks: e.target.value ? parseInt(e.target.value) : '' }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Semester <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="8"
                placeholder="cth: 1"
                value={form.semester}
                onChange={e => setForm(f => ({ ...f, semester: e.target.value ? parseInt(e.target.value) : '' }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Dosen <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="cth: Dr. Budi Santoso"
              value={form.lecturer_name}
              onChange={e => setForm(f => ({ ...f, lecturer_name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowModal(false); setForm(INITIAL_FORM); setEditingSubject(null) }}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
              {editingSubject ? <Edit size={14} /> : <Plus size={14} />} 
              {editingSubject ? ' Simpan Perubahan' : ' Tambah Matkul'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
