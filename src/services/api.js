/**
 * API Service — Native Fetch (No Axios)
 * Base URL: https://besosmed-production.up.railway.app
 * ─────────────────────────────────────────────────────────────────────────────
 * Semua endpoint Admin Dashboard terintegrasi di sini.
 * Gunakan VITE_API_BASE_URL di .env untuk override base URL.
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://besosmed-production.up.railway.app'

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('admin_token')
export const setToken = (t) => localStorage.setItem('admin_token', t)
export const removeToken = () => localStorage.removeItem('admin_token')

// ─── Core request helper ──────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // 204 No Content
    if (res.status === 204) return null

    // 401 → token expired / unauthorized
    if (res.status === 401) {
      removeToken()
      window.dispatchEvent(new Event('auth:logout'))
      throw new Error('Sesi habis, silakan login kembali.')
    }

    // Parse body (try JSON first)
    let body = null
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      body = await res.json()
    } else {
      body = await res.text()
    }

    if (!res.ok) {
      const message =
        (typeof body === 'object' ? body?.message ?? body?.error : body) ??
        `Request gagal (${res.status})`
      const err = new Error(message)
      err.status = res.status
      throw err
    }

    return body
  } catch (err) {
    if (err.name === 'TypeError' || err.name === 'AbortError') {
      throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')
    }
    throw err
  }
}

// ─── HTTP shortcuts ───────────────────────────────────────────────────────────
const http = {
  get: (ep, opts = {}) => request(ep, { method: 'GET', ...opts }),
  post: (ep, body, opts = {}) => request(ep, { method: 'POST', body: JSON.stringify(body ?? {}), ...opts }),
  patch: (ep, body, opts = {}) => request(ep, { method: 'PATCH', body: JSON.stringify(body ?? {}), ...opts }),
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔐 Auth
// POST /api/v1/admin/login  { nim, password }
// ═════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login: (nim, password) =>
    http.post('/api/v1/admin/login', { nim, password }),
}

// ═════════════════════════════════════════════════════════════════════════════
// 📝 Posts
// GET  /api/v1/admin/posts
// POST /api/v1/admin/posts/:id/takedown
// POST /api/v1/admin/posts/:id/untakedown
// GET  /api/v1/admin/search/posts?q=&limit=&skip=
// ═════════════════════════════════════════════════════════════════════════════
export const postsApi = {
  /** Ambil semua post untuk moderasi */
  getAll: (limit = 10, skip = 0) => {
    const params = new URLSearchParams({ limit, skip })
    return http.get(`/api/v1/admin/posts?${params}`)
  },

  /** Takedown post */
  takedown: (id) =>
    http.post(`/api/v1/admin/posts/${id}/takedown`),

  /** Batalkan takedown / pulihkan post */
  untakedown: (id) =>
    http.post(`/api/v1/admin/posts/${id}/untakedown`),

  /** Cari post (semua status) */
  search: (q, limit = 20, skip = 0) => {
    const params = new URLSearchParams({ q, limit, skip })
    return http.get(`/api/v1/admin/search/posts?${params}`)
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// 👤 Users
// POST /api/v1/admin/users/:id/ban
// POST /api/v1/admin/users/:id/unban
// GET  /api/v1/admin/search/users?q=&limit=&skip=
// ═════════════════════════════════════════════════════════════════════════════
export const usersApi = {
  /** Blokir akun user */
  ban: (id) =>
    http.post(`/api/v1/admin/users/${id}/ban`),

  /** Buka blokir akun user */
  unban: (id) =>
    http.post(`/api/v1/admin/users/${id}/unban`),

  /** Cari user (semua status) — q wajib diisi */
  search: (q, limit, skip) => {
    const p = { q }
    if (limit) p.limit = limit
    if (skip) p.skip = skip
    const params = new URLSearchParams(p)
    return http.get(`/api/v1/admin/search/users?${params}`)
  },
}

export const reportsApi = {
  getAll: (status = 'pending', limit = 20, skip = 0) => {
    const params = new URLSearchParams({ status, limit, skip })
    return http.get(`/api/v1/admin/reports?${params}`)
  },
  updateStatus: (id, status) =>
    http.patch(`/api/v1/admin/reports/${id}/status`, { status }),
}

// ═════════════════════════════════════════════════════════════════════════════
// 📚 Subjects (Mata Kuliah)
// GET  /api/v1/admin/subjects
// POST /api/v1/admin/subjects
// ═════════════════════════════════════════════════════════════════════════════
export const subjectsApi = {
  /** Ambil semua mata kuliah */
  getAll: () => http.get('/api/v1/admin/subjects'),

  /** Buat mata kuliah baru */
  create: (body) => http.post('/api/v1/admin/subjects', body),
}

// ═════════════════════════════════════════════════════════════════════════════
// 👥 Groups (Grup Chat Matkul)
// GET  /api/v1/admin/groups
// POST /api/v1/admin/groups/:conversationId/members
// ═════════════════════════════════════════════════════════════════════════════
export const groupsApi = {
  /** Ambil semua grup chat matkul */
  getAll: () => http.get('/api/v1/admin/groups'),

  /** Tambah mahasiswa (array NIM) ke grup */
  addMembers: (conversationId, students) =>
    http.post(`/api/v1/admin/groups/${conversationId}/members`, { students }),
}
