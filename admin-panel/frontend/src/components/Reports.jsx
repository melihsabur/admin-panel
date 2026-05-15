import { useState, useEffect } from 'react'
import { logAPI, groupAPI, userAPI, fileAPI } from '../api/client'
import { BarChart3, TrendingUp, PieChart } from 'lucide-react'

export default function Reports() {
  const [data, setData] = useState({ groups: [], users: [], files: [], logs: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      groupAPI.list().catch(() => ({ data: [] })),
      userAPI.list().catch(() => ({ data: [] })),
      fileAPI.list().catch(() => ({ data: [] })),
      logAPI.list({ limit: 100 }).catch(() => ({ data: [] }))
    ]).then(([g, u, f, l]) => {
      setData({ groups: g.data, users: u.data, files: f.data, logs: l.data })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const actionCounts = {}
  data.logs.forEach(l => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1
  })

  const groupUserCounts = {}
  data.groups.forEach(g => { groupUserCounts[g.name] = 0 })
  data.users.forEach(u => {
    const g = data.groups.find(gr => gr.id === u.group_id)
    if (g) groupUserCounts[g.name] = (groupUserCounts[g.name] || 0) + 1
  })

  const maxAction = Math.max(...Object.values(actionCounts), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Raporlar</h1>
        <p className="text-dark-200 mt-1">Sistem istatistikleri ve raporlar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" /> Islem Dagilimi
          </h2>
          <div className="space-y-3">
            {Object.entries(actionCounts).sort((a,b) => b[1]-a[1]).map(([action, count]) => (
              <div key={action}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-200">{action}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxAction) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {Object.keys(actionCounts).length === 0 && <p className="text-dark-200 text-sm">Veri yok</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-400" /> Grup Bazli Kullanici Sayisi
          </h2>
          <div className="space-y-4">
            {Object.entries(groupUserCounts).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                <span className="text-dark-200 font-medium">{name}</span>
                <span className="text-2xl font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" /> Dosya Istatistikleri
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-900 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">{data.files.length}</p>
              <p className="text-sm text-dark-200 mt-1">Toplam Dosya</p>
            </div>
            <div className="p-4 bg-dark-900 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">
                {(data.files.reduce((sum, f) => sum + (f.size || 0), 0) / 1048576).toFixed(1)}
              </p>
              <p className="text-sm text-dark-200 mt-1">Toplam MB</p>
            </div>
            <div className="p-4 bg-dark-900 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">
                {data.files.filter(f => f.ai_analysis).length}
              </p>
              <p className="text-sm text-dark-200 mt-1">AI Analiz</p>
            </div>
            <div className="p-4 bg-dark-900 rounded-lg text-center">
              <p className="text-3xl font-bold text-white">{data.logs.length}</p>
              <p className="text-sm text-dark-200 mt-1">Log Sayisi</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Sistem Ozeti</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-dark-700">
              <span className="text-dark-200">Toplam Grup</span>
              <span className="font-medium text-white">{data.groups.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-700">
              <span className="text-dark-200">Toplam Kullanici</span>
              <span className="font-medium text-white">{data.users.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-700">
              <span className="text-dark-200">Toplam Dosya</span>
              <span className="font-medium text-white">{data.files.length}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-dark-200">Toplam Log</span>
              <span className="font-medium text-white">{data.logs.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
