import {
  Users, MessageSquare, Heart, Share2,
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Zap, Eye, ShieldAlert, Calendar
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'

// Mock Data for Social Media Stats
const stats = [
  { label: 'Total Pengguna', value: '124,802', growth: '+12.5%', isUp: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Interaksi (Likes)', value: '892,401', growth: '+18.2%', isUp: true, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
  { label: 'Postingan Baru', value: '45,210', growth: '-2.4%', isUp: false, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Share/Repost', value: '12,405', growth: '+5.7%', isUp: true, icon: Share2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
]

const trendingPosts = [
  { id: 1, author: 'Fajar Kurnia', content: 'Tips belajar React untuk pemula...', likes: '1.2k', comments: 89, image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop' },
  { id: 2, author: 'Edy Syafrianto', content: 'Kenapa memilih Golang di 2024?', likes: '942', comments: 45, image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop' },
  { id: 3, author: 'Sisca Kohl', content: 'Mari kita coba integrasi API...', likes: '820', comments: 120, image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ringkasan Statistik</h1>
          <p className="text-slate-500 text-sm">Pantau performa ekosistem sosial media Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button className="px-4 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg shadow-md shadow-primary-200 transition-all">7 Hari Terakhir</button>
          <button className="px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-all">30 Hari</button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <Card key={idx} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon size={22} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-bold ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {item.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {item.growth}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{item.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-500" />
                Pertumbuhan Interaksi
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-xs text-slate-500">Bulan Ini</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="text-xs text-slate-500">Bulan Lalu</span>
                </div>
              </div>
            </div>

            {/* Modern & Cool Bar Chart Mockup */}
            <div className="relative h-72 w-full mt-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 group/chart">
              {/* Background Grid */}
              <div className="absolute inset-x-4 inset-y-6 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-full border-t border-slate-200/50 border-dashed" />
                ))}
              </div>

              {/* Bars Container */}
              <div className="relative h-full w-full flex items-end justify-between px-2 gap-3 z-10">
                {[45, 60, 35, 80, 55, 90, 70, 85, 40, 95, 65, 75].map((h, i) => (
                  <div key={i} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                    {/* Last Month Bar (Ghost Style) */}
                    <div 
                      className="w-full bg-slate-200/40 rounded-t-lg absolute bottom-0 border border-slate-200/50 transition-all duration-500" 
                      style={{ height: `${h * 0.7}%` }}
                    />
                    
                    {/* Current Month Bar (Gradient & Glow) */}
                    <div 
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 group-hover/bar:from-primary-500 group-hover/bar:to-primary-300 transition-all duration-300 rounded-t-lg relative z-10 shadow-[0_-4px_12px_rgba(59,130,246,0.2)] group-hover/bar:shadow-[0_-4px_20px_rgba(59,130,246,0.4)] group-hover/bar:-translate-y-1" 
                      style={{ height: `${h}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl font-bold translate-y-2 group-hover/bar:translate-y-0">
                        {h}k Interaksi
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              <span>Jan</span><span>Mar</span><span>Mei</span><span>Jul</span><span>Sep</span><span>Nov</span>
            </div>
          </Card>
        </div>

        {/* Trending Section */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Trending
              </h3>
              <button className="text-xs text-primary-600 font-bold hover:underline">Lihat Semua</button>
            </div>
            <div className="space-y-5">
              {trendingPosts.map(post => (
                <div key={post.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className="relative">
                    <img src={post.image} className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" alt="" />
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                      <div className="bg-primary-500 w-2 h-2 rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{post.content}</p>
                    <p className="text-[10px] text-slate-400 font-medium">@{post.author.toLowerCase().replace(' ', '_')}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary-600">
                      <Heart size={10} fill="currentColor" />
                      <span className="text-xs font-bold">{post.likes}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{post.comments} cmt</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* System Health */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                  <ShieldAlert size={16} className="text-emerald-400" />
                  Health Status
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Stable</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Storage Capacity</span>
                    <span className="text-xs font-mono text-white">72%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full w-[72%]" />
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                    <Calendar size={12} />
                    <span>Last Sync: Just now</span>
                  </div>
                  <button className="text-primary-400 text-[10px] font-bold hover:text-primary-300">Refresh</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
