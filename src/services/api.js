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
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }

  // Fastify menolak request tanpa body jika Content-Type diset application/json
  if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL
    const res = await fetch(`${cleanBaseUrl}${endpoint}`, {
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
    
    if (options.isBlob || contentType.includes('application/pdf')) {
      return await res.blob()
    }
    
    if (contentType.includes('application/json')) {
      body = await res.json()
    } else {
      body = await res.text()
    }

    if (!res.ok) {
      let message =
          (typeof body === 'object' ? body?.message ?? body?.error : body) ??
          `Request gagal (${res.status})`

      if (typeof message === 'string' && message.includes('Route ')) {
        message = 'Endpoint tidak ditemukan atau tidak valid (404)'
      }

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
  get:   (ep, opts = {}) => request(ep, { method: 'GET', ...opts }),
  post:  (ep, body, opts = {}) => request(ep, { method: 'POST', body: JSON.stringify(body ?? {}), ...opts }),
  put:   (ep, body, opts = {}) => request(ep, { method: 'PUT', body: JSON.stringify(body ?? {}), ...opts }),
  patch: (ep, body, opts = {}) => request(ep, { method: 'PATCH', body: JSON.stringify(body ?? {}), ...opts }),
  del:   (ep, opts = {}) => request(ep, { method: 'DELETE', ...opts }),
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
// 📊 Dashboard
// GET  /api/v1/admin/dashboard?range=
// ═════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  /** Ambil ringkasan statistik dan chart (range: 7 atau 30) */
  getStats: (range = 7) => http.get(`/api/v1/admin/dashboard?range=${range}`),
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

  /** Buat akun user / admin / dosen baru */
  create: (body) => http.post('/api/v1/admin/users', body),

  /** Edit akun user */
  update: (id, body) => http.put(`/api/v1/admin/users/${id}`, body),

  /** Import user massal via excel */
  importExcel: (formData) => request('/api/v1/admin/users/import', { method: 'POST', body: formData }),
}

// ═════════════════════════════════════════════════════════════════════════════
// 🎓 Majors (Program Studi / Jurusan)
// GET  /api/v1/admin/majors
// POST /api/v1/admin/majors
// ═════════════════════════════════════════════════════════════════════════════
export const majorsApi = {
  /** Ambil semua program studi */
  getAll: () => http.get('/api/v1/admin/majors'),

  /** Tambah program studi baru */
  create: (body) => http.post('/api/v1/admin/majors', body),

  /** Edit program studi */
  update: (id, body) => http.put(`/api/v1/admin/majors/${id}`, body),

  /** Hapus program studi */
  delete: (id) => http.del(`/api/v1/admin/majors/${id}`),
}

// ═════════════════════════════════════════════════════════════════════════════
// 🏛️ Communities
// GET   /api/v1/admin/communities/alumni
// PATCH /api/v1/chat/communities/:id
// ═════════════════════════════════════════════════════════════════════════════
export const communitiesApi = {
  /** Ambil semua komunitas alumni */
  getAlumni: () => http.get('/api/v1/admin/communities/alumni'),

  /** Edit komunitas (menggunakan FormData karena ada upload gambar) */
  update: (id, formData) => request(`/api/v1/chat/communities/${id}`, { method: 'PATCH', body: formData }),
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
  getAll: (code_prodi) => {
    let url = '/api/v1/admin/subjects'
    if (code_prodi) {
      url += `?code_prodi=${encodeURIComponent(code_prodi)}`
    }
    return http.get(url)
  },

  /** Buat mata kuliah baru */
  create: (body) => http.post('/api/v1/admin/subjects', body),

  /** Edit mata kuliah */
  update: (id, body) => http.put(`/api/v1/admin/subjects/${id}`, body),

  /** Hapus mata kuliah */
  delete: (id) => http.del(`/api/v1/admin/subjects/${id}`),
}

// ═════════════════════════════════════════════════════════════════════════════
// 👥 Groups (Grup Chat Matkul)
// GET  /api/v1/admin/groups
// GET  /api/v1/admin/groups/:conversationId/members
// POST /api/v1/admin/groups/:conversationId/members
// DELETE /api/v1/admin/groups/:conversationId/members/:userId
// ═════════════════════════════════════════════════════════════════════════════
export const groupsApi = {
  /** Ambil semua grup chat matkul */
  getAll: () => http.get('/api/v1/admin/groups'),

  /** Ambil detail mahasiswa dalam grup */
  getMembers: (conversationId) =>
    http.get(`/api/v1/admin/groups/${conversationId}/members`),

  /** Tambah mahasiswa (array NIM) ke grup */
  addMembers: (conversationId, students) =>
    http.post(`/api/v1/admin/groups/${conversationId}/members`, { students }),

  /** Keluarkan satu mahasiswa dari grup */
  kickMember: (conversationId, userId) =>
    http.del(`/api/v1/admin/groups/${conversationId}/members/${userId}`),

  /** Hapus grup chat matkul beserta avatarnya */
  delete: (groupId) => http.del(`/api/v1/chat-matkul/${groupId}`),

  /** Download laporan analitik PDF */
  downloadAnalyticsPdf: (conversationId) => 
    request(`/api/v1/admin/groups/${conversationId}/analytics/pdf`, { method: 'GET', isBlob: true }),
}

// ═════════════════════════════════════════════════════════════════════════════
// ⚡ Chat Matkul (Batch Sync)
// POST /api/v1/chat-matkul/sync
// ═════════════════════════════════════════════════════════════════════════════
export const chatSyncApi = {
  /** Sinkronisasi daftar mahasiswa ke grup matkul (Batch) */
  sync: (body) => http.post('/api/v1/chat-matkul/sync', body),

  /** Import grup matkul massal via excel */
  importExcel: (formData) => request('/api/v1/chat-matkul/import', { method: 'POST', body: formData }),
}
