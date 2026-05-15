import { useState, useEffect } from 'react'
import { logAPI, groupAPI, userAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Users, FolderOpen, Activity, BarChart3, TrendingUp, Clock } from 'lucide-react'

export default function Dashboard() {
  const { user, isSupervisor } = useAuth()
  const [stats, setStats] = useState(null)
  const [groups, setGroups] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, groupsRes, logsRes] = await Promise.all([
        logAPI.stats().catch(() => ({ data: {} })),
        groupAPI.list().catch(() => ({ data: [] })),
        logAPI.list({ limit: 5 }).catch(() => ({ data: [] }))
      ])
      setStats(statsRes.data)
      setGroups(groupsRes.data)
      setRecentLogs(logsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const statCards = [
    { label: 'Toplam Kullanici', value: stats?.total_users || 0, icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
    { label: 'Toplam Grup', value: stats?.total_groups || 0, icon: BarChart3, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10' },
    { label: 'Toplam Dosya', value: stats?.total_files || 0, icon: FolderOpen, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
    { label: 'Toplam Log', value: stats?.total_logs || 0, icon: Activity, color: 'from-orange-500 to-red-500', bg: 'bg-orange-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hos Geldiniz, {user?.full_name || user?.username} 👋</h1>
        <p className="text-dark-200 mt-1">Sistem durumu ve genel istatistikler</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card group hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-200">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 bg-gradient-to-r ${card.color} bg-clip-text`} style={{color: 'inherit'}} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isSupervisor && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" /> Grup Dagilimi
            </h2>
            <div className="space-y-3">
              {(stats?.users_per_group || []).map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                  <span className="text-dark-200">{g.group_name}</span>
                  <span className="badge bg-primary-600/20 text-primary-400">{g.user_count} kullanici</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" /> Son Islemler
          </h2>
          <div className="space-y-2">
            {recentLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
                <div className={`w-2 h-2 rounded-full ${log.action === 'LOGIN' ? 'bg-green-400' : log.action === 'DELETE' ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-200 truncate">{log.details}</p>
                  <p className="text-xs text-dark-700">{log.created_at}</p>
                </div>
                <span className="badge bg-dark-800 text-dark-200 text-xs">{log.action}</span>
              </div>
            ))}
            {recentLogs.length === 0 && <p className="text-dark-200 text-sm">Henuz islem yok</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
