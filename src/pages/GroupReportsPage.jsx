import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, RefreshCw, MessageSquare, Loader2 } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import { useToast } from '../context/ToastContext'
import { groupsApi } from '../services/api'

function extractGroups(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.groups)) return data.groups
  if (data.data && Array.isArray(data.data.groups)) return data.data.groups
  if (Array.isArray(data.data)) return data.data
  return []
}

export default function GroupReportsPage() {
  const toast = useToast()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await groupsApi.getAll()
      setGroups(extractGroups(data))
    } catch (err) {
      toast.error(err.message, { title: 'Gagal memuat grup' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleDownloadPdf = async (id, name) => {
    setDownloadingId(id)
    try {
      const blob = await groupsApi.downloadAnalyticsPdf(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Analitik_${name.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Berhasil mengunduh laporan "${name}".`)
    } catch (err) {
      toast.error(err.message || 'Gagal mengunduh PDF', { title: 'Gagal Unduh' })
    } finally {
      setDownloadingId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Grup Chat',
      render: (row) => {
        const name = row.name || row.subject_name || row.group_name || '-'
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{name}</p>
              {(row.subject_code || row.code) && (
                <span className="text-[10px] font-mono text-slate-400">
                  {row.subject_code || row.code}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'academic_year',
      label: 'Tahun Akademik',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.academic_year || '-'}
        </span>
      ),
    },
    {
      key: 'member_count',
      label: 'Jumlah Anggota',
      render: (row) => {
        const count = row.member_count ?? row.members_count ?? (Array.isArray(row.members) ? row.members.length : '-')
        return <span className="text-sm font-semibold text-slate-700">{count} Mahasiswa</span>
      },
    },
    {
      key: 'actions',
      label: 'Unduh Laporan',
      render: (row) => {
        const id = row._id || row.id || row.conversation_id
        const name = row.name || row.subject_name || 'Grup'
        const isDownloading = downloadingId === id

        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDownloadPdf(id, name)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            {isDownloading ? ' Mengunduh...' : ' Unduh PDF'}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan Tugas</h2>
          <p className="text-sm text-slate-500 mt-0.5">Unduh PDF analitik laporan tugas untuk setiap grup</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchGroups(true)} loading={refreshing}>
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
      </div>

      <Card padding={false}>
        <Table
          columns={columns}
          data={groups}
          loading={loading}
          skeletonRows={5}
          emptyMessage="Belum ada grup yang tersedia."
        />
        <div className="px-4 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
          <span>{groups.length} grup chat terdaftar</span>
        </div>
      </Card>
    </div>
  )
}
