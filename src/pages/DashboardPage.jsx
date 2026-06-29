import { useState, useEffect } from 'react'
import {
  Users, MessageSquare, Heart, Share2,
  TrendingUp, ShieldAlert, Calendar
} from 'lucide-react'
import Card from '../components/Card'
import { useToast } from '../context/ToastContext'
import { dashboardApi } from '../services/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(7)
  
  const [summary, setSummary] = useState({
    total_users: 0,
    total_posts: 0,
    total_likes: 0,
    total_reposts: 0
  })
  
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await dashboardApi.getStats(range)
        const data = res.data || res // Menyesuaikan dengan struktur response
        
        if (data.summary) {
          setSummary(data.summary)
        }
        
        if (data.interaction_chart) {
          // Format untuk recharts: [{ name: 'Mon', value: 10 }, ...]
          const labels = data.interaction_chart.labels || []
          const values = data.interaction_chart.data || []
          const formatted = labels.map((lbl, idx) => ({
            name: lbl,
            value: values[idx] || 0
          }))
          setChartData(formatted)
        }
      } catch (err) {
        toast.error(err.message || 'Gagal memuat dashboard', { title: 'Error API' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboard()
  }, [range, toast])

  const statCards = [
    { label: 'Total Pengguna', value: summary.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Postingan', value: summary.total_posts, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Interaksi (Likes)', value: summary.total_likes, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Total Repost', value: summary.total_reposts, icon: Share2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ringkasan Statistik</h1>
          <p className="text-slate-500 text-sm">Pantau performa ekosistem sosial media Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setRange(7)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              range === 7 ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button 
            onClick={() => setRange(30)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              range === 30 ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((item, idx) => (
          <Card key={idx} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon size={22} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                {loading ? '...' : item.value.toLocaleString('id-ID')}
              </h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-500" />
                Grafik Interaksi ({range} Hari)
              </h3>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-xl shadow-slate-200 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                    <ShieldAlert size={16} className="text-emerald-400" />
                    Sistem & API
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Online</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Database Connection</span>
                      <span className="text-xs font-mono text-emerald-400">Stable</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Socket Realtime</span>
                      <span className="text-xs font-mono text-emerald-400">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-8 flex items-center justify-between border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                  <Calendar size={12} />
                  <span>Last Sync: {new Date().toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
