import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, X, Hash, CalendarDays, User2, RefreshCw } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { subjectsApi } from '../services/api'

function extractSubjects(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.subjects)) return data.subjects
  if (data.data && Array.isArray(data.data.subjects)) return data.data.subjects
  if (Array.isArray(data.data)) return data.data
  return []
}

const INITIAL_FORM = { code: '', name: '', academic_year: '', lecturer_name: '' }

export default function SubjectsPage() {
  const toast = useToast()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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

  useEffect(() => { fetchSubjects() }, [fetchSubjects])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code || !form.name || !form.academic_year) {
      toast.error('Kode, Nama, dan Tahun Akademik wajib diisi.', { title: 'Form Tidak Lengkap' })
      return
    }
    setSubmitting(true)
    try {
      await subjectsApi.create(form)
      toast.success('Mata kuliah berhasil ditambahkan!', { title: 'Berhasil' })
      setShowModal(false)
      setForm(INITIAL_FORM)
      fetchSubjects(true)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Membuat Matkul' })
    } finally {
      setSubmitting(false)
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
      key: 'group_count',
      label: 'Grup Chat',
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.group_count ?? row.groups_count ?? '-'}
        </span>
      ),
    },
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

      {/* Modal Tambah Matkul */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(INITIAL_FORM) }} title="Tambah Mata Kuliah Baru" size="lg">
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
                Tahun Akademik <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="cth: 2024/2025"
                value={form.academic_year}
                onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))}
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
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowModal(false); setForm(INITIAL_FORM) }}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
              <Plus size={14} /> Tambah Matkul
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
