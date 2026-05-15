import { useState, useEffect } from 'react'
import { logAPI } from '../api/client'
import { ScrollText, Filter, RefreshCw } from 'lucide-react'

export default function LogViewer() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState({ action: '', entity_type: '', limit: 50 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLogs() }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.action) params.action = filter.action
      if (filter.entity_type) params.entity_type = filter.entity_type
      params.limit = filter.limit
      const res = await logAPI.list(params)
      setLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  const actionColors = {
    LOGIN: 'bg-green-500/20 text-green-400',
    LOGOUT: 'bg-gray-500/20 text-gray-400',
    CREATE: 'bg-blue-500/20 text-blue-400',
    UPDATE: 'bg-yellow-500/20 text-yellow-400',
    DELETE: 'bg-red-500/20 text-red-400',
    UPLOAD: 'bg-purple-500/20 text-purple-400',
    ASSIGN_SCREEN: 'bg-cyan-500/20 text-cyan-400',
    REMOVE_SCREEN: 'bg-orange-500/20 text-orange-400',
    AI_ANALYZE: 'bg-pink-500/20 text-pink-400',
    AI_PROMPT: 'bg-indigo-500/20 text-indigo-400',
    REGISTER: 'bg-emerald-500/20 text-emerald-400',
  }

  const actions = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'ASSIGN_SCREEN', 'REMOVE_SCREEN', 'AI_ANALYZE', 'REGISTER']
  const entityTypes = ['auth', 'user', 'group', 'group_screen', 'file', 'ai']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Log Kayitlari</h1>
          <p className="text-dark-200 mt-1">Tum sistem islemlerinin kayitlari</p>
        </div>
        <button onClick={loadLogs} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-white">Filtreler</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={filter.action} onChange={(e) => setFilter({...filter, action: e.target.value})} className="input-field w-auto">
            <option value="">Tum Islemler</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filter.entity_type} onChange={(e) => setFilter({...filter, entity_type: e.target.value})} className="input-field w-auto">
            <option value="">Tum Tipler</option>
            {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filter.limit} onChange={(e) => setFilter({...filter, limit: parseInt(e.target.value)})} className="input-field w-auto">
            <option value="25">25 kayit</option>
            <option value="50">50 kayit</option>
            <option value="100">100 kayit</option>
          </select>
          <button onClick={loadLogs} className="btn-primary text-sm">Filtrele</button>
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-900">
              <th className="text-left p-3 text-xs font-medium text-dark-200">ID</th>
              <th className="text-left p-3 text-xs font-medium text-dark-200">Tarih</th>
              <th className="text-left p-3 text-xs font-medium text-dark-200">Islem</th>
              <th className="text-left p-3 text-xs font-medium text-dark-200">Tip</th>
              <th className="text-left p-3 text-xs font-medium text-dark-200">Detay</th>
              <th className="text-left p-3 text-xs font-medium text-dark-200">Kaynak</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="p-3 text-xs text-dark-200">{log.id}</td>
                <td className="p-3 text-xs text-dark-200">{log.created_at?.replace('T', ' ').slice(0, 19)}</td>
                <td className="p-3"><span className={`badge ${actionColors[log.action] || 'bg-dark-800 text-dark-200'}`}>{log.action}</span></td>
                <td className="p-3 text-xs text-dark-200">{log.entity_type || '-'}</td>
                <td className="p-3 text-xs text-dark-200 max-w-xs truncate" title={log.details}>{log.details}</td>
                <td className="p-3 text-xs text-dark-200">{log.triggered_by || log.source || 'api'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-12 text-dark-200">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Log kaydi bulunamadi</p>
          </div>
        )}
      </div>
    </div>
  )
}
