import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Hash, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nim: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.nim.trim()) e.nim = 'NIM wajib diisi'
    if (!form.password.trim()) e.password = 'Password wajib diisi'
    else if (form.password.length < 4) e.password = 'Password minimal 4 karakter'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)

    const result = await login(form.nim.trim(), form.password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setLoginError(result.message ?? 'NIM atau password salah.')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setLoginError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-100 flex items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg shadow-primary-200 mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Masuk menggunakan NIM & Password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          {/* API Error */}
          {loginError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* NIM */}
            <div>
              <label htmlFor="login-nim" className="block text-sm font-medium text-slate-700 mb-1.5">
                NIM <span className="text-slate-400 font-normal">(Nomor Induk Mahasiswa)</span>
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-nim"
                  type="text"
                  name="nim"
                  value={form.nim}
                  onChange={handleChange}
                  placeholder="Contoh: 2021001234"
                  autoComplete="username"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50
                    focus:outline-none focus:ring-2 focus:bg-white transition-all
                    ${errors.nim
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-primary-200 focus:border-primary-400'
                    }
                  `}
                />
              </div>
              {errors.nim && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />{errors.nim}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className={`
                    w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-slate-50
                    focus:outline-none focus:ring-2 focus:bg-white transition-all
                    ${errors.password
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-primary-200 focus:border-primary-400'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />{errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full py-3 text-base mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk sebagai Admin'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Khusus admin yang berwenang · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
