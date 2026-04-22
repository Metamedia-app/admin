import { createContext, useContext, useState, useEffect } from 'react'
import { authApi, getToken, removeToken } from '../services/api'

const AuthContext = createContext(null)

// ─── Normalizer: Mengubah data mentah API ke format UI ────────────────────────
function normalizeUser(raw, defaultNim = '') {
  if (!raw) return { name: 'Admin', nim: defaultNim, email: '', role: 'Administrator', avatar: 'AD' }
  
  // Ambil nama dari berbagai kemungkinan field (termasuk 'nama' sesuai curl)
  const name = raw.nama || raw.name || raw.full_name || raw.username || 'Admin User'
  const nim  = raw.nim || raw.username || defaultNim
  const role = raw.role || 'Administrator'
  
  return {
    id:     raw.id || raw._id || '',
    name,
    nim,
    email:  raw.email || '',
    role:   role.charAt(0).toUpperCase() + role.slice(1), // Kapitalisasi 'admin' -> 'Admin'
    avatar: name.slice(0, 2).toUpperCase(),
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken())
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_user')
      return saved ? normalizeUser(JSON.parse(saved)) : normalizeUser(null)
    } catch {
      return normalizeUser(null)
    }
  })

  useEffect(() => {
    const handleAutoLogout = () => {
      removeToken()
      localStorage.removeItem('admin_user')
      setIsAuthenticated(false)
      setAdminUser(normalizeUser(null))
    }
    window.addEventListener('auth:logout', handleAutoLogout)
    return () => window.removeEventListener('auth:logout', handleAutoLogout)
  }, [])

  const login = async (nim, password) => {
    try {
      const data = await authApi.login(nim, password)

      // Cari token di dalam response (data.token atau data.data.token)
      const token = data?.token || data?.data?.token || data?.access_token
      if (!token) throw new Error('Token tidak ditemukan dalam respons server.')

      // Cari data user (data.user atau data.data.user atau gunakan NIM jika tidak ada)
      const rawUser = data?.user || data?.data?.user || { nim }
      const user = normalizeUser(rawUser, nim)

      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(rawUser))
      
      setIsAuthenticated(true)
      setAdminUser(user)
      return { success: true }
    } catch (err) {
      console.error('Login Error Context:', err)
      return { success: false, message: err.message || 'Login gagal, periksa NIM & Password.' }
    }
  }

  const logout = () => {
    removeToken()
    localStorage.removeItem('admin_user')
    setIsAuthenticated(false)
    setAdminUser(normalizeUser(null))
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
