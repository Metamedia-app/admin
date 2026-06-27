import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, RefreshCw, Users, ShieldCheck, GraduationCap,
  Plus, X, Eye, EyeOff, BookMarked, Loader2, Building2, Edit
} from 'lucide-react'
import Card    from '../components/Card'
import Table   from '../components/Table'
import Button  from '../components/Button'
import Modal   from '../components/Modal'
import Badge   from '../components/Badge'
import { useToast } from '../context/ToastContext'
import { usersApi } from '../services/api'

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Mahasiswa (User)' },
  { value: 'dosen',  label: 'Dosen' },
  { value: 'admin',  label: 'Admin' },
]

const STATUS_OPTIONS = [
  { value: 'AKTIF',       label: 'Aktif' },
  { value: 'TIDAK AKTIF', label: 'Tidak Aktif' },
  { value: 'ALUMNI',      label: 'Alumni' },
]

const INITIAL_FORM = {
  nim: '', nama: '', email: '', password: '',
  role: 'user', program_studi: '', status_mahasiswa: 'AKTIF',
}

function RoleBadge({ role }) {
  const map = {
    admin: { variant: 'removed', label: 'Admin' },
    dosen: { variant: 'info',    label: 'Dosen' },
    user:  { variant: 'active',  label: 'Mahasiswa' },
  }
  const cfg = map[role] ?? { variant: 'default', label: role }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

function StatusBadge({ status }) {
  const map = {
    'AKTIF':       { variant: 'active',  label: 'Aktif' },
    'TIDAK AKTIF': { variant: 'removed', label: 'Tidak Aktif' },
    'ALUMNI':      { variant: 'default', label: 'Alumni' },
  }
  const cfg = map[status] ?? { variant: 'default', label: status ?? '-' }
  return <Badge label={cfg.label} variant={cfg.variant} />
}

export default function UserManagementPage() {
  const toast = useToast()

  /* ── Create user state ── */
  const [showUserModal, setShowUserModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  /* ── Create User ── */
  const handleCreateUser = async (e) => {
    e.preventDefault()
    const required = ['nim', 'nama', 'email', 'password', 'program_studi']
    for (const field of required) {
      if (!form[field]?.trim()) {
        toast.error(`Field "${field}" wajib diisi.`, { title: 'Form Tidak Lengkap' })
        return
      }
    }
    setSubmitting(true)
    try {
      await usersApi.create(form)
      toast.success(`Akun "${form.nama}" berhasil dibuat!`, { title: 'Berhasil' })
      setShowUserModal(false)
      setForm(INITIAL_FORM)
    } catch (err) {
      toast.error(err.message, { title: 'Gagal Membuat Akun' })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Shared input style ── */
  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 focus:bg-white transition-all'
  const selectCls = inputCls + ' appearance-none cursor-pointer'

  return (
    <>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h2>
            <p className="text-sm text-slate-500 mt-0.5">Tambah akun baru</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowUserModal(true)}>
            <UserPlus size={14} /> Buat Akun Baru
          </Button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Role Tersedia', value: '3', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Status Akun', value: '3', icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
          ].map((s) => (
            <Card key={s.label}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Role & Status Info Panel ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary-500" /> Daftar Role
            </h4>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((r) => (
                <div key={r.value} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">{r.label}</span>
                  <RoleBadge role={r.value} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary-500" /> Status Akun
            </h4>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s) => (
                <div key={s.value} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <StatusBadge status={s.value} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ══════ Modal Buat Akun ══════ */}
      <Modal
        isOpen={showUserModal}
        onClose={() => { setShowUserModal(false); setForm(INITIAL_FORM) }}
        title="Buat Akun Pengguna Baru"
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* NIM */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">NIM <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="cth: 225501001"
                value={form.nim} onChange={e => setForm(f => ({ ...f, nim: e.target.value }))}
                className={inputCls}
              />
            </div>
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                type="text" placeholder="cth: Budi Santoso"
                value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input
              type="email" placeholder="cth: budi@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={inputCls + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role <span className="text-red-500">*</span></label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className={selectCls}
              >
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status Mahasiswa <span className="text-red-500">*</span></label>
              <select
                value={form.status_mahasiswa}
                onChange={e => setForm(f => ({ ...f, status_mahasiswa: e.target.value }))}
                className={selectCls}
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowUserModal(false); setForm(INITIAL_FORM) }}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
              <UserPlus size={14} /> Buat Akun
            </Button>
          </div>
        </form>
      </Modal>

    </>
  )
}
