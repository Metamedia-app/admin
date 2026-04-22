import { useEffect, useState } from 'react'
import { Users, FileText, ShieldAlert, TrendingUp, ArrowUpRight, Clock, Activity } from 'lucide-react'
import Card from '../components/Card'
import { postsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { adminUser } = useAuth()
  const [stats, setStats] = useState([
    { id: 'users', label: 'Total Users', value: '1,240', icon: Users, color: 'text-primary-600', bg: 'bg-primary-50', change: '+12% bln ini' },
    { id: 'posts', label: 'Total Posts', value: '0', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', change: 'Live Data' },
    { id: 'reports', label: 'Active Reports', value: '14', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', change: 'Simulasi' },
    { id: 'growth', label: 'Engagement', value: '24.8%', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', change: '+4.3% bln ini' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const postsData = await postsApi.getAll()
        const rawItems = Array.isArray(postsData) ? postsData : (postsData?.data || postsData?.posts || [])
        const count = rawItems.length || 0
        
        setStats(prev => prev.map(s => {
          if (s.id === 'posts') return { ...s, value: count.toString() }
          return s
        }))
      } catch (err) {
        console.error('Dashboard Fetch Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-800">Selamat Datang, {adminUser?.name || 'Admin'} 👋</h2>
        <p className="text-sm text-slate-500 mt-1">NIM: {adminUser?.nim || '-'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const displayValue = stat.value !== undefined && stat.value !== null ? stat.value.toString() : '0'
          
          return (
            <Card key={stat.id} className="transition-all hover:shadow-md border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {loading && stat.id === 'posts' ? (
                      <span className="inline-block w-12 h-6 bg-slate-100 animate-pulse rounded" />
                    ) : displayValue}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                    <ArrowUpRight size={10} />
                    {stat.change}
                  </div>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary-600" />
              <h3 className="font-bold text-slate-800">Aktivitas Terbaru</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { id: 1, type: 'Takedown', target: 'Post #821', admin: 'Admin', time: '2 menit yang lalu' },
              { id: 2, type: 'Ban', target: 'User 20210042', admin: 'Admin', time: '15 menit yang lalu' },
            ].map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.type === 'Ban' ? 'bg-red-500' : 'bg-primary-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{log.type}: <span className="text-slate-500 font-normal">{log.target}</span></p>
                    <p className="text-xs text-slate-400">Oleh {log.admin}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 italic">{log.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Clock size={18} className="text-primary-600" />
            <h3 className="font-bold text-slate-800">Status Server</h3>
          </div>
          <div className="space-y-6">
            {[
              { label: 'API Gateway', status: 'Operational', value: 98, color: 'bg-emerald-500' },
              { label: 'Media Storage', status: 'Healthy', value: 42, color: 'bg-primary-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-bold text-slate-600">{item.label}</span>
                  <span className="text-emerald-600 font-semibold">{item.status}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} transition-all duration-1000 ease-out`} 
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
