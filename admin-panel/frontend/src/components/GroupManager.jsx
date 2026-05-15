import { useState, useEffect } from 'react'
import { groupAPI } from '../api/client'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, Settings } from 'lucide-react'

export default function GroupManager() {
  const [groups, setGroups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', settings: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadGroups() }, [])

  const loadGroups = async () => {
    try {
      const res = await groupAPI.list()
      setGroups(res.data)
    } catch (err) {
      toast.error('Gruplar yuklenemedi')
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await groupAPI.update(editId, form)
        toast.success('Grup guncellendi')
      } else {
        await groupAPI.create(form)
        toast.success('Grup olusturuldu')
      }
      resetForm()
      loadGroups()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Islem basarisiz')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu grubu silmek istediginize emin misiniz?')) return
    try {
      await groupAPI.delete(id)
      toast.success('Grup silindi')
      loadGroups()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silme basarisiz')
    }
  }

  const startEdit = (group) => {
    setEditId(group.id)
    setForm({ name: group.name, description: group.description, settings: group.settings || {} })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm({ name: '', description: '', settings: {} })
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Grup Yonetimi</h1>
          <p className="text-dark-200 mt-1">Gruplari olusturun, duzenleyin ve silin</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Yeni Grup
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Grup Duzenle' : 'Yeni Grup Olustur'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Grup Adi</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="input-field" placeholder="ornegin: Ogrenci" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Aciklama</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                className="input-field" rows="3" placeholder="Grup hakkinda kisa aciklama" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> {editId ? 'Guncelle' : 'Olustur'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary flex items-center gap-2">
                <X className="w-4 h-4" /> Iptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="card hover:border-primary-500/50 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{group.name}</h3>
                  <p className="text-xs text-dark-200">ID: {group.id}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(group)} className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-primary-400">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(group.id)} className="p-2 rounded-lg hover:bg-dark-800 text-dark-200 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-dark-200 mt-3">{group.description || 'Aciklama yok'}</p>
            {group.settings?.allowed_file_types && (
              <div className="mt-3 flex flex-wrap gap-1">
                {group.settings.allowed_file_types.map((t) => (
                  <span key={t} className="badge bg-dark-800 text-dark-200">.{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
