import { useState, useEffect } from 'react'
import { screenAPI, groupAPI } from '../api/client'
import toast from 'react-hot-toast'
import { Monitor, Plus, Trash2, Check, X, Shield } from 'lucide-react'

export default function ScreenAssignment() {
  const [groups, setGroups] = useState([])
  const [screens, setScreens] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupScreens, setGroupScreens] = useState([])
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState({ screen_id: '', permissions: { create: false, read: true, update: false, delete: false } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([groupAPI.list(), screenAPI.list()])
      .then(([g, s]) => { setGroups(g.data); setScreens(s.data) })
      .catch(() => toast.error('Veriler yuklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  const selectGroup = async (group) => {
    setSelectedGroup(group)
    try {
      const res = await screenAPI.groupScreens(group.id)
      setGroupScreens(res.data)
    } catch (err) {
      toast.error('Ekranlar yuklenemedi')
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    try {
      await screenAPI.assign({
        group_id: selectedGroup.id,
        screen_id: parseInt(assignForm.screen_id),
        permissions: assignForm.permissions
      })
      toast.success('Ekran atandi')
      selectGroup(selectedGroup)
      setShowAssignForm(false)
      setAssignForm({ screen_id: '', permissions: { create: false, read: true, update: false, delete: false } })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Atama basarisiz')
    }
  }

  const handleRemove = async (assignmentId) => {
    if (!window.confirm('Bu ekran atamasini kaldirmak istiyor musunuz?')) return
    try {
      await screenAPI.removeAssignment(assignmentId)
      toast.success('Ekran atamasi kaldirildi')
      selectGroup(selectedGroup)
    } catch (err) {
      toast.error('Kaldirma basarisiz')
    }
  }

  const togglePermission = async (assignment, perm) => {
    const newPerms = { ...assignment.permissions, [perm]: !assignment.permissions[perm] }
    try {
      await screenAPI.updateAssignment(assignment.assignment_id, {
        group_id: selectedGroup.id,
        screen_id: assignment.screen_id,
        permissions: newPerms
      })
      toast.success('Yetki guncellendi')
      selectGroup(selectedGroup)
    } catch (err) {
      toast.error('Guncelleme basarisiz')
    }
  }

  const availableScreens = screens.filter(s => !groupScreens.some(gs => gs.screen_id === s.id))

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ekran Atama</h1>
        <p className="text-dark-200 mt-1">Gruplara ekran atayip yetkileri yonetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grup Listesi */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Gruplar</h2>
          <div className="space-y-2">
            {groups.map((g) => (
              <button key={g.id} onClick={() => selectGroup(g)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedGroup?.id === g.id ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' : 'hover:bg-dark-800 text-dark-200'}`}>
                <span className="font-medium">{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Atanmis Ekranlar */}
        <div className="lg:col-span-2 card">
          {selectedGroup ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">{selectedGroup.name} - Ekranlar</h2>
                {availableScreens.length > 0 && (
                  <button onClick={() => setShowAssignForm(true)} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Ekran Ata
                  </button>
                )}
              </div>

              {showAssignForm && (
                <form onSubmit={handleAssign} className="mb-6 p-4 bg-dark-900 rounded-lg border border-dark-700 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">Ekran Sec</label>
                    <select value={assignForm.screen_id} onChange={(e) => setAssignForm({...assignForm, screen_id: e.target.value})}
                      className="input-field" required>
                      <option value="">Ekran secin...</option>
                      {availableScreens.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">Yetkiler</label>
                    <div className="flex flex-wrap gap-3">
                      {['create', 'read', 'update', 'delete'].map((p) => (
                        <label key={p} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={assignForm.permissions[p]}
                            onChange={(e) => setAssignForm({...assignForm, permissions: {...assignForm.permissions, [p]: e.target.checked}})}
                            className="rounded bg-dark-800 border-dark-700 text-primary-600 focus:ring-primary-500" />
                          <span className="text-sm text-dark-200 capitalize">{p === 'create' ? 'Olusturma' : p === 'read' ? 'Okuma' : p === 'update' ? 'Guncelleme' : 'Silme'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Ata</button>
                    <button type="button" onClick={() => setShowAssignForm(false)} className="btn-secondary text-sm">Iptal</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {groupScreens.map((gs) => (
                  <div key={gs.assignment_id} className="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-dark-700">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-primary-400" />
                      <div>
                        <p className="font-medium text-white">{gs.name}</p>
                        <p className="text-xs text-dark-200">{gs.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {['create', 'read', 'update', 'delete'].map((p) => (
                        <button key={p} onClick={() => togglePermission(gs, p)}
                          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${gs.permissions?.[p] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-800 text-dark-200'}`}
                          title={`${p === 'create' ? 'Olusturma' : p === 'read' ? 'Okuma' : p === 'update' ? 'Guncelleme' : 'Silme'}`}>
                          {p.charAt(0).toUpperCase()}
                        </button>
                      ))}
                      <button onClick={() => handleRemove(gs.assignment_id)} className="p-1.5 rounded hover:bg-red-500/20 text-dark-200 hover:text-red-400 ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {groupScreens.length === 0 && <p className="text-dark-200 text-center py-8">Bu gruba henuz ekran atanmamis</p>}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-dark-200">
              <Shield className="w-16 h-16 mb-4 opacity-30" />
              <p>Ekranlarini yonetmek icin bir grup secin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
